# Architecture

## Overview

Storage Service UI - A Decentraland dApp for managing World and Player storage (env variables, scene data, player data).

## Technology Stack

| Technology                 | Version    | Purpose                   |
| -------------------------- | ---------- | ------------------------- |
| Vite                       | ^6.0.7     | Build tool and dev server |
| React                      | ^19.0.0    | UI framework              |
| TypeScript                 | ^5.7.3     | Type safety               |
| React Router               | ^7.1.3     | Client-side routing       |
| Redux Toolkit              | ^2.5.0     | State management          |
| RTK Query                  | (included) | Data fetching/caching     |
| decentraland-ui2           | ^0.15.0    | UI components             |
| decentraland-connect       | ^7.2.0     | Wallet connection         |
| @dcl/single-sign-on-client | 0.1.0      | Identity management       |
| decentraland-crypto-fetch  | ^1.0.2     | Signed fetch requests     |

## Data Fetching

RTK Query is used for all server state. See [rtk-query.md](rtk-query.md) for signed vs non-signed request patterns, wrappers (`createQueryFetch`, `wrapSignedFetch`), and which feature clients use each pattern.

## Provider Hierarchy

```
<BrowserRouter>
  <AuthProvider config={authConfig}>
    <Provider store={store}>        {/* Redux - for RTK Query */}
      <DclThemeProvider theme={darkTheme}>
        <Layout>
          <AppRoutes />
        </Layout>
      </DclThemeProvider>
    </Provider>
  </AuthProvider>
</BrowserRouter>
```

## Folder Structure (Features Pattern)

```
src/
├── app/                    # App-wide setup
│   ├── store.ts            # Redux store configuration
│   └── hooks.ts            # Typed Redux hooks
│
├── components/             # Shared/reusable components
│   ├── Layout/             # Shell layout (Navbar, Footer)
│   ├── StorageDrawer/      # Collapsible persistent/mini Drawer (storage nav)
│   ├── StorageLayout/      # StorageDrawer + content area wrapper
│   ├── WorldStoragePanel/
│   ├── PlayerStoragePanel/
│   ├── StorageForm/
│   └── ConfirmDialog/
│
├── config/                 # Environment configuration
│   ├── index.ts            # Config factory (@dcl/ui-env)
│   └── env/                # Per-environment JSON files
│       ├── dev.json
│       ├── stg.json
│       └── prd.json
│
├── features/               # Feature modules (self-contained)
│   ├── auth/               # Authentication feature
│   │   ├── index.ts        # Public API (exports)
│   │   ├── AuthProvider.tsx
│   │   ├── auth.types.ts
│   │   └── auth.utils.ts
│   ├── permissions/        # Permissions (realm/position validation)
│   │   ├── index.ts
│   │   ├── PermissionsProvider.tsx
│   │   ├── permissions.client.ts
│   │   ├── permissions.types.ts
│   │   └── permissions.utils.ts
│   ├── assets/             # Asset selector (lands, worlds)
│   ├── env/                # Env storage feature
│   ├── scene/              # Scene storage feature
│   └── player/             # Player storage feature
│
├── lib/                    # Utilities and helpers
│   └── fetch.ts            # createQueryFetch, wrapSignedFetch
├── utils/
│   └── storage-api.ts      # World/player storage API (signed fetch)
│
├── pages/                  # Route page components
│   ├── Home/
│   ├── Select/             # SelectPage (asset selector)
│   ├── Storage/            # StorageGate, StoragePage (not in current route tree)
│   ├── Login/
│   ├── Unauthorized/
│   ├── MissingParams/
│   ├── Env/
│   ├── Scene/
│   ├── Players/
│   └── NotFound/
│
├── routes/                 # Route definitions
│   └── routes.tsx
│
├── intl/                   # Internationalization
│   └── en.json             # English translation strings
│
├── services/               # API clients
│   └── client.ts           # RTK Query base client
│
└── test/                   # Test utilities
    ├── setup.ts            # Vitest global setup
    ├── server.ts           # MSW server
    ├── handlers/           # MSW request handlers
    └── utils.tsx           # Test render utilities
```

## Feature Module Pattern

Each feature is self-contained with:

- `index.ts` - Public exports (barrel file)
- `*.types.ts` - TypeScript interfaces
- `*.utils.ts` - Pure utility functions
- Component files (`.tsx`)
- Test files (`.test.ts`, `.test.tsx`)

**Import rule**: Only import from feature's `index.ts`, never internal files.

```typescript
// ✅ Good
import { useAuth, AuthProvider } from '@/features/auth'

// ❌ Bad
import { useAuth } from '@/features/auth/AuthProvider'
```

## Environment Configuration

Uses `@dcl/ui-env` for environment-based config:

```typescript
import { config } from '@/config'

const authUrl = config.get('AUTH_URL')
```

| Environment | AUTH_URL                         |
| ----------- | -------------------------------- |
| Development | `/auth` (proxied)                |
| Staging     | `https://decentraland.zone/auth` |
| Production  | `https://decentraland.org/auth`  |

## Vite Proxy (Development)

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

## Route Structure

| Path       | Component    | Description                                                                                    |
| ---------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `/`        | RootRedirect | If no `realm`/`position` in URL → redirect to `/select`. Else → redirect to `/env` with params |
| `/select`  | SelectPage   | Asset selector (lands and worlds); user picks realm or position                                |
| `/env`     | Env          | Environment variables                                                                          |
| `/scene`   | Scene        | Scene storage                                                                                  |
| `/players` | Players      | Player storage                                                                                 |
| `*`        | NotFound     | 404 fallback                                                                                   |

**RootRedirect** (`src/routes/routes.tsx`): Reads `realm` and `position` from URL. If both missing, navigates to `/select`. If either present, navigates to `/env` preserving search params so Env/Scene/Players can use the same context.

**StorageLayout** wraps `/env`, `/scene`, and `/players` routes. It renders a **StorageDrawer** (collapsible sidebar with nav links) alongside the active page content via `<Outlet />`.

## i18n

All user-facing strings use `useTranslation()` from `@dcl/hooks`. The `TranslationProvider` is set up in `App.tsx` wrapping the entire application. Translation keys are defined in `src/intl/en.json`.

## Roadmap (Phases)

| Phase   | Scope                                                                                                                                                                                                                                        | Status   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **4.1** | Storage UI with features pattern: auth + permissions (realm/position), Login/Unauthorized/MissingParams pages, StorageGate/StoragePage with WorldStoragePanel and PlayerStoragePanel (signed fetch, storage-api, ConfirmDialog, StorageForm) | Done     |
| 4.2+    | Refinements and extensions to storage UI (e.g. Alert/Snackbar feedback, UX polish)                                                                                                                                                           | Planned  |
| **5**   | Asset selector when no realm/position: user picks world or parcel from owned/operated lands and worlds                                                                                                                                       | **Done** |

All storage UI work follows the **features pattern**: auth, permissions, assets, env, scene, and player live under `src/features/` (barrel exports, types, utils, tests).

## Query Parameters

The app uses URL params for authorization context:

| Param      | Format | Purpose                                                           |
| ---------- | ------ | ----------------------------------------------------------------- |
| `realm`    | string | World name (e.g. `myworld.dcl.eth`); used after selecting a world |
| `position` | `x,y`  | Parcel coordinates (e.g. `10,20`); used after selecting a land    |

At root `/`, if neither param is present the user is sent to `/select` to choose an asset. If either is present (e.g. from a bookmark or deep link), the app redirects to `/env` with the same params so storage pages have context.

## Key Dependencies Notes

- **@dcl/single-sign-on-client**: Must use v0.1.0 (not v2.x) for auth server compatibility
- **decentraland-connect**: Handles wallet connection state and events
- **decentraland-crypto-fetch**: Signs requests with user identity
