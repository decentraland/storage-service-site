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

export { createAuthenticatedFetch, isIdentityValid, signedFetch }
