import type { AuthIdentity } from '@dcl/crypto'
import { getIdentity } from '@dcl/single-sign-on-client'
import signedFetchLib from 'decentraland-crypto-fetch'

/**
 * Perform a signed fetch request using the identity from SSO
 * @param url - The URL to fetch
 * @param wallet - The wallet address to get the identity for
 * @param init - Optional fetch init options
 * @returns Promise<Response>
 */
const signedFetch = async (url: string, wallet: string, init?: RequestInit): Promise<Response> => {
  const identity = await getIdentity(wallet)

  if (!identity) {
    throw new Error('No identity found for wallet')
  }

  return signedFetchLib(url, {
    ...init,
    identity
  })
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
 * Creates an authenticated fetch function that automatically uses signed requests when user is authenticated
 * This function should be used inside React components that have access to useAuth
 *
 * @param wallet - Current wallet address from useAuth
 * @param isSignedIn - Authentication status from useAuth
 * @returns A fetch function that automatically handles authentication
 */
const createAuthenticatedFetch = (wallet?: string, isSignedIn?: boolean) => {
  return async (url: string, init?: RequestInit): Promise<Response> => {
    try {
      // Only attempt signed fetch if user is signed in and we have a wallet
      if (isSignedIn && wallet) {
        const identity = await getIdentity(wallet)

        if (identity && isIdentityValid(identity)) {
          // Await the result so errors are caught by the try/catch
          const response = await signedFetchLib(url, {
            ...init,
            identity
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

export { createAuthenticatedFetch, isIdentityValid, signedFetch, wrapSignedFetch, type WrapSignedFetchError, type SignedFetch }
