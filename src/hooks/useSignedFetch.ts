import { useCallback, useMemo } from 'react'
import { useAuth } from '@/features/auth'
import { createAuthenticatedFetch } from '@/lib/fetch'

type AuthenticatedFetch = (url: string, init?: RequestInit) => Promise<Response>

const useSignedFetch = (): AuthenticatedFetch => {
  const { wallet, isSignedIn } = useAuth()

  const authenticatedFetch = useMemo(() => createAuthenticatedFetch(wallet, isSignedIn), [wallet, isSignedIn])

  return useCallback(authenticatedFetch, [authenticatedFetch])
}

export { useSignedFetch }
