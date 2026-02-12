import type { AuthIdentity } from '@dcl/crypto'
import { getIdentity } from '@dcl/single-sign-on-client'
import signedFetchLib from 'decentraland-crypto-fetch'

/**
 * Build the metadata object required by the storage service signed fetch (ADR-44).
 * - `realm` query param → `{ realm: { serverName }, realmName }` (world name)
 * - `position` query param → `{ parcel }` (base parcel coordinates, e.g. "10,20")
 */
const buildSignedFetchMetadata = (realm?: string | null, position?: string | null): Record<string, unknown> => {
  const meta: Record<string, unknown> = {}
  if (realm) {
    meta.realm = { serverName: realm }
    meta.realmName = realm
  }
  if (position) {
    meta.parcel = position
  }
  return meta
}

/**
 * Check if an identity is valid (not expired)
 * @param identity - The identity to check
 * @returns boolean
 */
const isIdentityValid = (identity: AuthIdentity | null): boolean => {
  if (!identity || !identity.expiration) {
    return false
  }

  const expiration = new Date(identity.expiration)
  const now = new Date()

  return now.getTime() <= expiration.getTime()
}

/**
 * Creates an authenticated fetch function that automatically uses signed requests when user is authenticated.
 * The returned function accepts an optional `additionalMetadata` parameter which is forwarded to the
 * signed-fetch library and serialised into the `X-Identity-Metadata` header (used by the storage
 * service to scope requests to a realm / parcel).
 *
 * @param wallet - Current wallet address from useAuth
 * @param isSignedIn - Authentication status from useAuth
 * @returns A fetch function that automatically handles authentication
 */
const createAuthenticatedFetch = (wallet?: string, isSignedIn?: boolean) => {
  return async (url: string, init?: RequestInit, additionalMetadata: Record<string, unknown> = {}): Promise<Response> => {
    try {
      // Only attempt signed fetch if user is signed in and we have a wallet
      if (isSignedIn && wallet) {
        const identity = await getIdentity(wallet)

        if (identity && isIdentityValid(identity)) {
          // Await the result so errors are caught by the try/catch
          const response = await signedFetchLib(url, {
            ...init,
            identity,
            metadata: additionalMetadata
          })
          return response
        }
      }

      // Fall back to regular fetch if not authenticated or no valid identity
      return fetch(url, init)
    } catch (error) {
      console.warn('Error in authenticatedFetch, falling back to regular fetch:', error)
      return fetch(url, init)
    }
  }
}

/** Error shape thrown by wrapSignedFetch (RTK Query baseQuery–compatible) */
type WrapSignedFetchError = { status: number; data?: unknown } | { status: 'FETCH_ERROR'; error: string }

type SignedFetch = (url: string, init?: RequestInit) => Promise<Response>

/**
 * Creates a SignedFetch for use in RTK Query queryFn. Reads realm/position from window.location.search.
 * Use this instead of passing signedFetch as a param — pass wallet and isSignedIn, then call createQueryFetch inside the queryFn.
 */
const createQueryFetch = (wallet?: string, isSignedIn?: boolean): SignedFetch => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const metadata = buildSignedFetchMetadata(params.get('realm'), params.get('position'))
  const authFetch = createAuthenticatedFetch(wallet, isSignedIn)
  return (url: string, init?: RequestInit) => authFetch(url, init, metadata)
}

/**
 * Creates a SignedFetch with explicit realm/position. Use this for queries/mutations that
 * cache by realm/position to prevent data contamination when queryArgs don't match URL params.
 */
const createScopedQueryFetch = (wallet?: string, isSignedIn?: boolean, realm?: string | null, position?: string | null): SignedFetch => {
  const metadata = buildSignedFetchMetadata(realm, position)
  const authFetch = createAuthenticatedFetch(wallet, isSignedIn)
  return (url: string, init?: RequestInit) => authFetch(url, init, metadata)
}

/**
 * Wrapper around signedFetch: call fetch, check response.ok, parse JSON.
 * Returns parsed JSON on success. Throws on non-OK or network error (caller can return { error } in catch).
 */
const wrapSignedFetch = async <T>(signedFetch: SignedFetch, url: string, init: RequestInit = { method: 'GET' }): Promise<T> => {
  try {
    const response = await signedFetch(url, init)
    if (!response.ok) {
      throw {
        status: response.status,
        data: await response.text().catch(() => undefined)
      }
    }
    return (await response.json()) as T
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) throw error
    throw {
      status: 'FETCH_ERROR' as const,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export {
  createAuthenticatedFetch,
  createQueryFetch,
  createScopedQueryFetch,
  isIdentityValid,
  wrapSignedFetch,
  type WrapSignedFetchError,
  type SignedFetch
}
