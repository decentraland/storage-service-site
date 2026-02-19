# Permissions Feature

## Overview

The permissions feature validates whether the signed-in user can manage storage for a given **world (realm)** or **parcel (position)**. It fetches realm permissions from the Worlds Content Server and parcel operators from the Peer Lambda, then uses utility functions to determine if the user's wallet has access. The `PermissionsProvider` component wraps protected content and renders `UnauthorizedPage` when the user lacks permission.

## Dependencies

| Dependency                          | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| RTK Query (via `@/services/client`) | Data fetching and caching               |
| `@/config`                          | `WORLDS_CONTENT_SERVER_URL`, `PEER_URL` |
| `@/features/auth`                   | `useAuth` for wallet and sign-in status |
| `@/pages/Unauthorized`              | Fallback UI when user has no permission |

## Architecture

```
URL params (realm or position)
    │
    ▼
PermissionsProvider
    │
    ├─► Not signed in / no wallet → UnauthorizedPage
    │
    ├─► realm provided → useGetRealmPermissionsQuery(realm)
    │       │
    │       └─► hasRealmPermission(permissions, wallet) → children or UnauthorizedPage
    │
    └─► position provided → parsePosition("x,y") → useGetParcelOperatorsQuery(x, y)
            │
            └─► hasParcelPermission(operators, wallet) → children or UnauthorizedPage
```

## Key Files

```
src/features/permissions/
├── index.ts                 # Public exports
├── permissions.client.ts    # RTK Query endpoints
├── permissions.types.ts     # TypeScript interfaces
├── permissions.utils.ts     # hasRealmPermission, hasParcelPermission
└── PermissionsProvider.tsx  # Gate component
```

## Types

### WorldPermissions

```typescript
interface WorldPermissions {
  permissions: {
    deployment: DeploymentPermission
    streaming: StreamingPermission
    access: AccessPermission
  }
  owner: string
  summary: Record<string, unknown>
}
```

### DeploymentPermission / StreamingPermission

```typescript
interface DeploymentPermission {
  type: 'allow-list' | 'unrestricted'
  wallets: string[]
}
```

### ParcelOperators

```typescript
interface ParcelOperators {
  owner: string
  operator: string | null
  updateOperator: string | null
  updateManagers: string[]
  approvedForAll: string[]
}
```

## RTK Query Endpoints

| Endpoint              | Hook                          | Description                                                |
| --------------------- | ----------------------------- | ---------------------------------------------------------- |
| `getRealmPermissions` | `useGetRealmPermissionsQuery` | GET `{WORLDS_CONTENT_SERVER_URL}/world/:realm/permissions` |
| `getParcelOperators`  | `useGetParcelOperatorsQuery`  | GET `{PEER_URL}/lambdas/parcels/:x/:y/operators`           |

Both endpoints use tag type `Permissions` with an id (`realm` or `x,y`) for cache invalidation.

## Permission Logic

### Realm (World)

User has permission if they are:

- The **owner** of the realm (case-insensitive comparison), or
- Listed in **deployment.wallets** (allow-list)

### Parcel

User has permission if they are:

- The **owner** of the parcel, or
- The **operator**, or
- The **updateOperator**, or
- In the **approvedForAll** list

All address comparisons are case-insensitive.

## Usage

### PermissionsProvider

Requires either `realm` or `position` (not both in the same provider instance). `position` must be in format `"x,y"` (e.g. `"10,20"`).

```typescript
import { PermissionsProvider } from '@/features/permissions'

// For a world
<PermissionsProvider realm="myworld.dcl.eth">
  <StoragePage />
</PermissionsProvider>

// For a parcel
<PermissionsProvider position="10,20">
  <StoragePage />
</PermissionsProvider>
```

### Permission Utils

```typescript
import { hasRealmPermission, hasParcelPermission } from '@/features/permissions'

const canDeploy = hasRealmPermission(worldPermissions, walletAddress)
const canUpdateParcel = hasParcelPermission(parcelOperators, walletAddress)
```

## Configuration

| Config Key                  | Purpose                              |
| --------------------------- | ------------------------------------ |
| `WORLDS_CONTENT_SERVER_URL` | Base URL for realm permissions API   |
| `PEER_URL`                  | Base URL for parcel operators Lambda |

See `src/config/env/dev.json` (and stg/prd) for values.
