// Provider and hook
export { AuthProvider, useAuth } from './AuthProvider'

// Types
export type { AddEthereumChainParameters, AuthConfig, AuthContextValue, AuthProviderProps, ProviderSwitchError } from './auth.types'

// Utilities
export {
  buildRedirectUrl,
  createAuthConfig,
  debugLog,
  defaultFetchAvatar,
  defaultShouldUseBasePath,
  getAddEthereumChainParameters,
  getChainName,
  getProviderChainId,
  isIdentityValid
} from './auth.utils'
