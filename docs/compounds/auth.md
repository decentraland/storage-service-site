# Authentication Feature

## Overview

Authentication using Decentraland's SSO (Single Sign-On) system. Users authenticate via the central auth service, which stores identity in localStorage. The app checks for valid identity on load and redirects to auth when needed.

## Dependencies

| Package                    | Version | Purpose                      |
| -------------------------- | ------- | ---------------------------- |
| decentraland-connect       | ^7.2.0  | Wallet connection management |
| @dcl/single-sign-on-client | 0.1.0   | Identity storage/retrieval   |
| decentraland-crypto-fetch  | ^1.0.2  | Signed HTTP requests         |

**Critical**: Use `@dcl/single-sign-on-client@0.1.0`, not v2.x. The auth server uses v0.1.0 API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AuthProvider                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  State:                                              │    │
│  │  - wallet: string | undefined                        │    │
│  │  - avatar: Avatar | undefined                        │    │
│  │  - chainId: ChainId                                  │    │
│  │  - isSignedIn: boolean                               │    │
│  │  - isConnecting: boolean                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Actions:                                            │    │
│  │  - signIn() → redirect to /auth/login                │    │
│  │  - signOut() → disconnect + clear identity           │    │
│  │  - changeNetwork(chainId) → wallet_switchEthereumChain│   │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Auth Flow

### 1. Initial Load (checkAuthStatus)

```
App Loads
    │
    ▼
connection.tryPreviousConnection()
    │
    ├─► No wallet found → isSignedIn = false, isConnecting = false
    │
    └─► Wallet found
            │
            ▼
        localStorageGetIdentity(wallet)
            │
            ├─► No identity or expired → isSignedIn = false
            │
            └─► Valid identity → isSignedIn = true
                    │
                    ▼
                fetchAvatar(wallet)
```

**Re-check and recovery**

- Auth state is re-checked when the tab becomes visible (`visibilitychange`) or the window gains focus, so connection changes (e.g. user connected in another tab, or WalletConnect session restored) are picked up without reloading.
- When connection is unavailable on this origin (e.g. user signed in via redirect to another origin such as `decentraland.org/auth`), signed-in state can still be restored from the **last known wallet** and a valid identity in localStorage. The last wallet is persisted when the user has a valid session and is cleared on sign out.

### 2. Sign In

```
User clicks "Sign In"
    │
    ▼
signIn() called
    │
    ▼
buildRedirectUrl(config, pathname, search)
    │
    ▼
window.location.replace("/auth/login?redirectTo=...")
    │
    ▼
[Auth service handles login]
    │
    ▼
Redirects back to app with identity in localStorage
```

### 3. Sign Out

```
User clicks "Sign Out"
    │
    ▼
signOut() called
    │
    ▼
connection.disconnect()
    │
    ▼
localStorageClearIdentity(wallet)
    │
    ▼
Clear last-wallet from localStorage
    │
    ▼
Clear state (wallet, avatar, isSignedIn)
```

## Key Files

```
src/features/auth/
├── index.ts           # Public exports
├── AuthProvider.tsx   # Context provider + useAuth hook
├── auth.types.ts      # TypeScript interfaces
└── auth.utils.ts      # Utility functions
```

## Types

### AuthContextValue

```typescript
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
```

### AuthConfig

```typescript
interface AuthConfig {
  authUrl: string // e.g., "/auth" or "https://decentraland.zone/auth"
  basePath: string // e.g., "/storage"
  defaultChainId: ChainId // e.g., ChainId.ETHEREUM_MAINNET
  shouldUseBasePath?: (host: string) => boolean // Determines if basePath needed
  fetchAvatar?: (address: string) => Promise<Avatar | undefined>
  debug?: boolean
}
```

## Usage

### Provider Setup (App.tsx)

```typescript
import { AuthProvider, type AuthConfig } from '@/features/auth'
import { config } from '@/config'
import { ChainId } from '@dcl/schemas'

const App = () => {
  const authConfig: AuthConfig = useMemo(() => ({
    authUrl: config.get('AUTH_URL'),
    basePath: '/storage',
    defaultChainId: ChainId.ETHEREUM_MAINNET
  }), [])

  return (
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### Consuming Auth State

```typescript
import { useAuth } from '@/features/auth'

const MyComponent = () => {
  const { wallet, isSignedIn, isConnecting, signIn, signOut } = useAuth()

  if (isConnecting) return <Loading />
  if (!isSignedIn) return <Button onClick={signIn}>Sign In</Button>

  return <div>Connected: {wallet}</div>
}
```

## Vite Proxy Configuration

For local development, `/auth` is proxied to `decentraland.zone`:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/auth': {
      target: 'https://decentraland.zone',
      followRedirects: true,
      changeOrigin: true,
      secure: false,
      ws: true
    }
  }
}
```

**Important**:

- Target is `https://decentraland.zone` (without `/auth`)
- Path is NOT rewritten - `/auth/login` → `https://decentraland.zone/auth/login`
- `followRedirects: true` is required for auth redirects

## Environment URLs

| Environment | AUTH_URL                         | Notes           |
| ----------- | -------------------------------- | --------------- |
| dev.json    | `/auth`                          | Proxied locally |
| stg.json    | `https://decentraland.zone/auth` | Direct          |
| prd.json    | `https://decentraland.org/auth`  | Direct          |

## Redirect URL Logic

The `buildRedirectUrl` function handles the redirect back to the app:

```typescript
// For localhost (not decentraland.zone/org/today)
// basePath is NOT added
'/auth/login?redirectTo=/scene?realm=myworld'

// For decentraland.zone/org/today
// basePath IS added
'/auth/login?redirectTo=/storage/scene?realm=myworld'
```

## Identity Validation

```typescript
const isIdentityValid = (identity: { expiration?: Date | string } | null): boolean => {
  if (!identity || !identity.expiration) return false
  const expiration = new Date(identity.expiration)
  return new Date().getTime() <= expiration.getTime()
}
```

## Signed Fetch

For authenticated API calls, use `signedFetch` from `decentraland-crypto-fetch`:

```typescript
import { createAuthenticatedFetch } from '@/lib/fetch'

const { wallet, isSignedIn } = useAuth()
const authenticatedFetch = createAuthenticatedFetch(wallet, isSignedIn)

// Will use signed fetch if authenticated, regular fetch otherwise
const response = await authenticatedFetch('/api/endpoint')
```

## Reference Implementation

Based on `jump-site`'s AuthProvider:

- `/Users/gabriel.diazdecentraland.org/Projects/jump-site/src/contexts/auth/AuthProvider.tsx`
