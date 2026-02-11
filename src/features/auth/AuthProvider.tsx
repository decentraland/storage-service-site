import { type FC, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Avatar, ChainId } from '@dcl/schemas'
import { localStorageClearIdentity, localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { connection } from 'decentraland-connect'
import type { Provider } from 'decentraland-connect'
import {
  buildRedirectUrl,
  clearLastWallet,
  createAuthConfig,
  debugLog,
  getAddEthereumChainParameters,
  getLastWallet,
  getProviderChainId,
  isIdentityValid,
  setLastWallet
} from './auth.utils'
import type { AuthContextValue, AuthProviderProps, ProviderSwitchError } from './auth.types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TRY_PREVIOUS_CONNECTION_RETRY_DELAY_MS = 800

const AuthProvider: FC<AuthProviderProps> = ({ children, config: userConfig }) => {
  const { pathname, search } = useLocation()

  // Memoize configuration to prevent recreation on every render
  const config = useMemo(() => createAuthConfig(userConfig), [userConfig])
  const configRef = useRef(config)
  configRef.current = config

  const [wallet, setWallet] = useState<string>()
  const [avatar, setAvatar] = useState<Avatar>()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [chainId, setChainId] = useState<ChainId>(config.defaultChainId)

  // Refs for provider event cleanup
  const providerRef = useRef<Provider | null>(null)
  const accountsChangedRef = useRef<((accounts: string[]) => void) | null>(null)
  const chainChangedRef = useRef<((chainIdHex: string) => void) | null>(null)

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

      // Clear identity and last-wallet if we have a wallet address
      if (wallet) {
        localStorageClearIdentity(wallet)
      }
      clearLastWallet()

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

  // Initialize auth state on mount, re-check on visibility/focus, subscribe to provider events
  useEffect(() => {
    const cfg = configRef.current

    const applyWalletAndIdentity = async (walletAddress: string, connectedChainId?: ChainId): Promise<void> => {
      setWallet(walletAddress)
      if (connectedChainId !== undefined) {
        setChainId(connectedChainId)
      }
      let validIdentity = false
      try {
        const identity = localStorageGetIdentity(walletAddress)
        if (identity && isIdentityValid(identity)) {
          debugLog('Identity valid', { expiration: identity.expiration }, cfg.debug)
          validIdentity = true
        } else {
          debugLog('Identity expired or not found', undefined, cfg.debug)
        }
      } catch (identityError) {
        console.error('Error checking identity:', identityError)
      }
      setIsSignedIn(validIdentity)
      if (validIdentity) {
        setLastWallet(walletAddress)
        if (cfg.fetchAvatar) {
          try {
            debugLog('Fetching avatar', { address: walletAddress }, cfg.debug)
            const avatarData = await cfg.fetchAvatar(walletAddress)
            if (avatarData) {
              setAvatar(avatarData)
              debugLog('Avatar fetched successfully', avatarData, cfg.debug)
            }
          } catch (avatarError) {
            console.error('Error fetching avatar:', avatarError)
          }
        }
      } else {
        setAvatar(undefined)
      }
    }

    const clearConnectionState = (): void => {
      setWallet(undefined)
      setAvatar(undefined)
      setIsSignedIn(false)
    }

    const removeProviderListeners = (): void => {
      const provider = providerRef.current
      const onAccounts = accountsChangedRef.current
      const onChain = chainChangedRef.current
      if (provider && onAccounts) {
        provider.removeListener('accountsChanged', onAccounts)
      }
      if (provider && onChain) {
        provider.removeListener('chainChanged', onChain)
      }
      providerRef.current = null
      accountsChangedRef.current = null
      chainChangedRef.current = null
    }

    const checkAuthStatus = async (): Promise<void> => {
      removeProviderListeners()
      try {
        setIsConnecting(true)
        debugLog('Checking auth status', undefined, cfg.debug)

        let walletAddress: string | null = null
        let connectedChainId: ChainId | undefined
        let provider: Provider | null = null

        try {
          const response = await connection.tryPreviousConnection()
          walletAddress = response.account ?? null
          connectedChainId = response.chainId
          provider = response.provider ?? null
        } catch (error) {
          debugLog('Previous connection failed', error, cfg.debug)
        }

        if (!walletAddress) {
          await new Promise(resolve => setTimeout(resolve, TRY_PREVIOUS_CONNECTION_RETRY_DELAY_MS))
          try {
            const response = await connection.tryPreviousConnection()
            walletAddress = response.account ?? null
            connectedChainId = response.chainId
            provider = response.provider ?? null
          } catch {
            // use last-wallet recovery below
          }
        }

        if (walletAddress) {
          if (provider) {
            try {
              const currentChainId = await getProviderChainId(provider)
              connectedChainId = currentChainId
              debugLog('Using wallet current chain', { chainId: currentChainId }, cfg.debug)
            } catch {
              // keep connectedChainId from response if eth_chainId fails
            }
          }
          debugLog('Previous connection found', { address: walletAddress, chainId: connectedChainId }, cfg.debug)
          await applyWalletAndIdentity(walletAddress, connectedChainId)

          if (provider) {
            providerRef.current = provider
            const handleAccountsChanged = (accounts: string[]): void => {
              if (accounts.length === 0) {
                clearConnectionState()
                return
              }
              const address = accounts[0]
              void applyWalletAndIdentity(address)
            }
            const handleChainChanged = (chainIdHex: string): void => {
              const nextChainId = parseInt(chainIdHex, 16) as ChainId
              setChainId(nextChainId)
            }
            accountsChangedRef.current = handleAccountsChanged
            chainChangedRef.current = handleChainChanged
            provider.on('accountsChanged', handleAccountsChanged)
            provider.on('chainChanged', handleChainChanged)
          }
        } else {
          const lastWallet = getLastWallet()
          if (lastWallet) {
            try {
              const identity = localStorageGetIdentity(lastWallet)
              if (identity && isIdentityValid(identity)) {
                debugLog('Recovered session from last wallet', { address: lastWallet }, cfg.debug)
                await applyWalletAndIdentity(lastWallet, cfg.defaultChainId)
              }
            } catch {
              // ignore
            }
          }
          if (!lastWallet) {
            debugLog('No previous connection found', undefined, cfg.debug)
          }
        }
      } catch (error: unknown) {
        console.error('Error checking auth status:', error)
      } finally {
        setIsConnecting(false)
      }
    }

    void checkAuthStatus()

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        void checkAuthStatus()
      }
    }
    const handleWindowFocus = (): void => {
      void checkAuthStatus()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      removeProviderListeners()
    }
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
