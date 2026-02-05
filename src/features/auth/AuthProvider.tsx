import { type FC, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Avatar, ChainId } from '@dcl/schemas'
import { localStorageClearIdentity, localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { connection } from 'decentraland-connect'
import {
  buildRedirectUrl,
  createAuthConfig,
  debugLog,
  getAddEthereumChainParameters,
  getProviderChainId,
  isIdentityValid
} from './auth.utils'
import type { AuthContextValue, AuthProviderProps, ProviderSwitchError } from './auth.types'

// eslint-disable-next-line @typescript-eslint/naming-convention
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AuthProvider: FC<AuthProviderProps> = ({ children, config: userConfig }) => {
  const { pathname, search } = useLocation()

  // Memoize configuration to prevent recreation on every render
  const config = useMemo(() => createAuthConfig(userConfig), [userConfig])

  const [wallet, setWallet] = useState<string>()
  const [avatar, setAvatar] = useState<Avatar>()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [chainId, setChainId] = useState<ChainId>(config.defaultChainId)

  // Sign in - redirect to auth page
  const signIn = useCallback(() => {
    debugLog('Initiating sign in', { pathname, search }, config.debug)
    const redirectUrl = buildRedirectUrl(config, pathname, search)
    debugLog('Redirecting to auth', { redirectUrl }, config.debug)
    window.location.replace(redirectUrl)
  }, [pathname, search, config])

  const signOut = useCallback(() => {
    try {
      debugLog('Signing out', { wallet }, config.debug)

      // Disconnect wallet
      connection.disconnect()

      // Clear identity if we have a wallet address
      if (wallet) {
        localStorageClearIdentity(wallet)
      }

      // Clear state
      setWallet(undefined)
      setAvatar(undefined)
      setIsSignedIn(false)

      debugLog('Sign out completed', undefined, config.debug)
    } catch (error: unknown) {
      console.error('Error during sign-out:', error)
    }
  }, [wallet, config.debug])

  const changeNetwork = useCallback(
    async (newChainId: ChainId) => {
      try {
        debugLog('Changing network', { from: chainId, to: newChainId }, config.debug)

        const provider = await connection.getProvider()

        if (!provider) {
          console.error('No provider available to switch network')
          return
        }

        setChainId(newChainId)

        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + newChainId.toString(16) }]
          })

          const actualChainId = await getProviderChainId(provider)
          debugLog('Network changed successfully', { chainId: actualChainId }, config.debug)
        } catch (error) {
          const switchError = error as ProviderSwitchError
          if (switchError.code === 4902) {
            debugLog('Adding new chain to wallet', { chainId: newChainId }, config.debug)
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [getAddEthereumChainParameters(newChainId)]
            })
          } else {
            console.error('Error switching network:', switchError)
          }
        }
      } catch (error: unknown) {
        console.error('Error during network change:', error)
      }
    },
    [chainId, config.debug]
  )

  // Initialize auth state on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        debugLog('Checking auth status', undefined, config.debug)

        // Try to get the previous connection from decentraland-connect
        try {
          const { account: walletAddress, chainId: connectedChainId } = await connection.tryPreviousConnection()

          if (walletAddress) {
            debugLog('Previous connection found', { address: walletAddress, chainId: connectedChainId }, config.debug)

            setWallet(walletAddress)
            setChainId(connectedChainId)

            // Check identity
            let validIdentity = false
            try {
              const identity = localStorageGetIdentity(walletAddress)
              if (identity && isIdentityValid(identity)) {
                debugLog('Identity valid', { expiration: identity.expiration }, config.debug)
                validIdentity = true
              } else {
                debugLog('Identity expired or not found', undefined, config.debug)
              }
            } catch (identityError) {
              console.error('Error checking identity:', identityError)
            }

            setIsSignedIn(validIdentity)

            // Fetch avatar if identity is valid
            if (validIdentity && config.fetchAvatar) {
              try {
                debugLog('Fetching avatar', { address: walletAddress }, config.debug)
                const avatarData = await config.fetchAvatar(walletAddress)
                if (avatarData) {
                  setAvatar(avatarData)
                  debugLog('Avatar fetched successfully', avatarData, config.debug)
                }
              } catch (avatarError) {
                console.error('Error fetching avatar:', avatarError)
              }
            }
          } else {
            debugLog('No previous connection found', undefined, config.debug)
          }
        } catch (error) {
          debugLog('Previous connection failed', error, config.debug)
        }
      } catch (error: unknown) {
        console.error('Error checking auth status:', error)
      } finally {
        setIsConnecting(false)
      }
    }

    checkAuthStatus()
  }, [config])

  const contextValue: AuthContextValue = useMemo(
    () => ({
      wallet,
      avatar,
      chainId,
      isSignedIn,
      isConnecting,
      signIn,
      signOut,
      changeNetwork
    }),
    [wallet, avatar, chainId, isSignedIn, isConnecting, signIn, signOut, changeNetwork]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export { AuthProvider, useAuth }
