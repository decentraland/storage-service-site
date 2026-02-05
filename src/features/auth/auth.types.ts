import type { Avatar, ChainId } from '@dcl/schemas'

interface AuthContextValue {
  wallet: string | undefined
  chainId: ChainId | undefined
  avatar: Avatar | undefined
  isSignedIn: boolean
  isConnecting: boolean
  signIn: () => void
  signOut: () => void
  changeNetwork: (chainId: ChainId) => Promise<void>
}

interface AuthConfig {
  /** Auth service URL for redirecting to login */
  authUrl: string
  /** Base path for current application */
  basePath: string
  /** Default chain ID to start with */
  defaultChainId: ChainId
  /** Function to determine if current host requires basePath */
  shouldUseBasePath?: (host: string) => boolean
  /** Custom function to fetch user avatar */
  fetchAvatar?: (address: string) => Promise<Avatar | undefined>
  /** Debug mode for development */
  debug?: boolean
}

interface AuthProviderProps {
  children: React.ReactNode
  config: AuthConfig
}

interface AddEthereumChainParameters {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

interface ProviderSwitchError {
  code?: number
  message?: string
}

export type { AddEthereumChainParameters, AuthConfig, AuthContextValue, AuthProviderProps, ProviderSwitchError }
