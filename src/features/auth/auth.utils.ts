import type { Avatar, ChainId } from '@dcl/schemas'
import type { Provider } from 'decentraland-connect'
import type { AddEthereumChainParameters, AuthConfig } from './auth.types'

/**
 * Default Decentraland host check function
 */
const defaultShouldUseBasePath = (host: string): boolean => {
  return /^decentraland\.(zone|org|today)$/.test(host)
}

/**
 * Default avatar fetcher for Decentraland
 */
const defaultFetchAvatar = async (address: string, peerUrl = 'https://peer.decentraland.org'): Promise<Avatar | undefined> => {
  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles`, {
      method: 'POST',
      body: JSON.stringify({ ids: [address] })
    })

    const data = await response.json()

    if (data.length > 0 && data[0]?.avatars?.length > 0) {
      return data[0].avatars[0]
    }

    return undefined
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return undefined
  }
}

/**
 * Create auth configuration with all required values
 */
const createAuthConfig = (config: AuthConfig): AuthConfig => {
  return {
    shouldUseBasePath: defaultShouldUseBasePath,
    fetchAvatar: address => defaultFetchAvatar(address),
    ...config,
    debug: config.debug ?? process.env.NODE_ENV === 'development'
  }
}

// Chain name mapping using ChainId enum values as keys
const CHAIN_NAMES = new Map<number, string>([
  [1, 'Ethereum Mainnet'],
  [3, 'Ethereum Ropsten'],
  [4, 'Ethereum Rinkeby'],
  [5, 'Ethereum Goerli'],
  [10, 'Optimism Mainnet'],
  [42, 'Ethereum Kovan'],
  [56, 'BSC Mainnet'],
  [137, 'Polygon Mainnet'],
  [250, 'Fantom Mainnet'],
  [42161, 'Arbitrum Mainnet'],
  [43114, 'Avalanche Mainnet'],
  [80001, 'Polygon Mumbai'],
  [80002, 'Polygon Amoy'],
  [11155111, 'Ethereum Sepolia']
])

/**
 * Chain name mapping
 */
const getChainName = (chainId: ChainId): string => {
  return CHAIN_NAMES.get(chainId) || `Chain ID ${chainId}`
}

/**
 * Get Ethereum chain parameters for wallet operations
 */
const getAddEthereumChainParameters = (chainId: ChainId): AddEthereumChainParameters => {
  const hexChainId = '0x' + chainId.toString(16)
  const chainName = getChainName(chainId)

  // Polygon Mainnet
  if (chainId === 137) {
    return {
      chainId: hexChainId,
      chainName,
      nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
      rpcUrls: ['https://rpc-mainnet.maticvigil.com/'],
      blockExplorerUrls: ['https://polygonscan.com/']
    }
  }

  // Default to Ethereum
  return {
    chainId: hexChainId,
    chainName,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io']
  }
}

/**
 * Get provider chain ID
 */
const getProviderChainId = async (provider: Provider): Promise<ChainId> => {
  const chainIdHex = await provider.request({ method: 'eth_chainId' })
  return parseInt(chainIdHex as string, 16) as ChainId
}

/**
 * Debug logger for auth operations
 */
const debugLog = (message: string, data?: unknown, debug = false): void => {
  if (debug && typeof console !== 'undefined') {
    console.log(`[Auth] ${message}`, data || '')
  }
}

/**
 * Build redirect URL for authentication
 */
const buildRedirectUrl = (config: AuthConfig, pathname: string, search: string): string => {
  const searchParams = new URLSearchParams(search)
  const currentRedirectTo = searchParams.get('redirectTo')

  // Determine if we should use basePath
  const basePath = config.shouldUseBasePath?.(window.location.host) ? config.basePath : ''

  const redirectTo = !currentRedirectTo ? `${basePath}${pathname}${search}` : `${basePath}${currentRedirectTo}`

  return `${config.authUrl}/login?redirectTo=${redirectTo}`
}

/**
 * Check if an identity is valid (not expired)
 */
const isIdentityValid = (identity: { expiration?: Date | string } | null): boolean => {
  if (!identity || !identity.expiration) {
    return false
  }

  const expiration = new Date(identity.expiration)
  const now = new Date()

  return now.getTime() <= expiration.getTime()
}

const LAST_WALLET_STORAGE_KEY = 'dcl-storage-ui-last-wallet'

/**
 * Storage key for last connected wallet (used for recovery when tryPreviousConnection fails)
 */
const getLastWalletKey = (): string => LAST_WALLET_STORAGE_KEY

/**
 * Get last connected wallet address from localStorage
 */
const getLastWallet = (): string | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(LAST_WALLET_STORAGE_KEY) : null
  } catch {
    return null
  }
}

/**
 * Persist last connected wallet address (call when we have a valid session)
 */
const setLastWallet = (address: string): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_WALLET_STORAGE_KEY, address)
    }
  } catch {
    // ignore
  }
}

/**
 * Clear last connected wallet from localStorage (call on sign out)
 */
const clearLastWallet = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAST_WALLET_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export {
  buildRedirectUrl,
  clearLastWallet,
  createAuthConfig,
  debugLog,
  defaultFetchAvatar,
  defaultShouldUseBasePath,
  getAddEthereumChainParameters,
  getChainName,
  getLastWallet,
  getLastWalletKey,
  getProviderChainId,
  isIdentityValid,
  setLastWallet
}
