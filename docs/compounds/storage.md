# Storage UI Integration Layer

## Overview

The storage UI layer ties together auth, permissions, and storage features. The **current route flow** uses **RootRedirect** at `/`: no `realm`/`position` → redirect to **SelectPage** (asset selector); with params → redirect to `/env` with params. Env, Scene, and Players are direct routes wrapped by **StorageLayout** (which renders the **StorageDrawer** sidebar + content area). The codebase also includes **StorageGate** and **StoragePage** (tabbed World / Player storage with **WorldStoragePanel**, **PlayerStoragePanel**) for a gated flow; they are not in the current route tree but can be used if a protected `/storage` route is added. Shared utilities: **StorageForm**, **ConfirmDialog**, **storage-api.ts**. Requests to the storage API use signed fetch when the user is authenticated (via `createQueryFetch` in RTK Query endpoints).

## Flow (Current Routes)

```
User navigates to /
    │
    ▼
RootRedirect (reads realm, position from URL)
    │
    ├─► No realm and no position → Navigate to /select
    │       │
    │       ▼
    │   SelectPage (AssetSelectorPage): user picks world or land
    │       │
    │       └─► Navigate to /env?realm=... or /env?position=...
    │
    └─► realm or position present → Navigate to /env with same params
            │
            ▼
        Env / Scene / Players pages (direct routes; use params for API context)
```

**Optional gated flow** (StorageGate not in current routes): If a route like `/storage` is added with StorageGate, flow would be: check params → MissingParamsPage if none; check auth → LoginPage if not signed in; PermissionsProvider(realm | position) → UnauthorizedPage or StoragePage (WorldStoragePanel | PlayerStoragePanel).

## Route Structure

| Path       | Component    | Description                                                 |
| ---------- | ------------ | ----------------------------------------------------------- |
| `/`        | RootRedirect | Redirect to /select (no params) or /env with params         |
| `/select`  | SelectPage   | Asset selector (AssetSelectorPage); picks realm or position |
| `/env`     | Env          | Environment variables (feature page)                        |
| `/scene`   | Scene        | Scene storage (feature page)                                |
| `/players` | Players      | Player storage (feature page)                               |
| `*`        | NotFound     | 404                                                         |

**Query parameters**: `realm` (world name) and `position` (e.g. `10,20`) are read at root and preserved when redirecting to `/env`. Env/Scene/Players use them for API context.

## Key Files

```
src/routes/
└── routes.tsx        # RootRedirect, AppRoutes; /, /select, /env, /scene, /players

src/pages/Select/
└── SelectPage.tsx    # Wraps AssetSelectorPage (assets feature)

src/pages/Storage/
├── StorageGate.tsx   # Gate: params → auth → permissions → StoragePage (not in current routes)
└── StoragePage.tsx   # Tabs: World storage | Player storage

src/pages/Login/
└── LoginPage.tsx     # Sign-in CTA; uses useAuth().signIn

src/pages/Unauthorized/
└── UnauthorizedPage.tsx   # "Access denied" + Go back

src/pages/MissingParams/
└── MissingParamsPage.tsx  # Instructions for realm/position params

src/components/WorldStoragePanel/
└── WorldStoragePanel.tsx  # World key-value UI; passes wallet/isSignedIn to storage-api

src/components/PlayerStoragePanel/
└── PlayerStoragePanel.tsx  # Player key-value UI; passes wallet/isSignedIn to storage-api

src/components/StorageDrawer/
└── StorageDrawer.tsx # Collapsible persistent/mini Drawer with nav items (env, scene, player, storages)

src/components/StorageLayout/
└── StorageLayout.tsx # Wrapper rendering StorageDrawer sidebar + main content area (Outlet)

src/components/StorageForm/
└── StorageForm.tsx   # Reusable key + value form; configurable labels/placeholders

src/components/ConfirmDialog/
└── ConfirmDialog.tsx # Reusable confirmation dialog; optional destructive styling

src/utils/
└── storage-api.ts     # World/player API helpers; accept AuthenticatedFetch

src/lib/
└── fetch.ts           # createQueryFetch, createAuthenticatedFetch, wrapSignedFetch
```

## StorageDrawer

A collapsible persistent/mini MUI Drawer that provides navigation between storage pages:

- **Nav items**: Environment variables (`/env`), Scene storage (`/scene`), Player storage (`/players`), and a Storages group header.
- **Collapse/expand**: The drawer toggles between a mini (icons-only) state and a full-width state with labels.
- Uses React Router's `useNavigate` and `useLocation` to highlight the active route.

## StorageLayout

A layout wrapper component that renders:

- **StorageDrawer** on the left as a sidebar.
- **Content area** on the right, rendering the matched child route via React Router's `<Outlet />`.

The Env, Scene, and Players pages are nested inside `StorageLayout` in the route tree, so they all share the persistent navigation drawer.

## i18n

All user-facing strings across storage pages use `useTranslation()` from `@dcl/hooks`. Translations are defined in `src/intl/en.json`. The `TranslationProvider` is set up in `App.tsx` wrapping the entire app.

## StorageGate (optional; not in current routes)

- Reads `realm` and `position` from `useSearchParams()`.
- If neither is present (after trim), renders **MissingParamsPage**.
- If not signed in (and not connecting), renders **LoginPage**.
- Otherwise wraps **StoragePage** in **PermissionsProvider** with `realm` and `position` (trimmed).
- Use this component if you add a protected route (e.g. `/storage`) that requires params and permissions before showing storage UI.

## StoragePage

- Renders a title and short description, then **Tabs** (decentraland-ui2): "World storage" and "Player storage".
- Active tab content: **WorldStoragePanel** or **PlayerStoragePanel**.

## WorldStoragePanel

- Passes **wallet** and **isSignedIn** from **useAuth** to storage-api helpers.
- **StorageForm**: key + value (JSON); onSubmit calls **upsertWorldValue(signedFetch, key, value)**.
- "Delete by key": text input + Delete button; calls **deleteWorldValue(signedFetch, key)**.
- "Clear all world storage" button opens **ConfirmDialog**; on confirm calls **clearWorldStorage(signedFetch)**.
- Displays error/success messages from responses.

## PlayerStoragePanel

- Passes **wallet** and **isSignedIn** from **useAuth** to storage-api helpers.
- Player address text field scopes the **StorageForm** submit to **upsertPlayerValue(signedFetch, playerAddress, key, value)**.
- "Delete by player and key": two inputs + Delete; calls **deletePlayerValue(signedFetch, address, key)**.
- "Clear storage for player" opens a **ConfirmDialog**; on confirm calls **clearPlayerStorage(signedFetch, address)**.
- "Clear all player storage" opens another **ConfirmDialog**; on confirm calls **clearAllPlayersStorage(signedFetch)**.
- Displays error/success messages.

## StorageForm

Reusable form with:

- **keyLabel**, **valueLabel**, **submitLabel**, **keyPlaceholder**, **valuePlaceholder**
- **onSubmit(key: string, value: string)** (can return Promise)
- **disabled**

Clears key/value on successful submit. Submit button disabled when key or value is empty or when **disabled** is true.

## ConfirmDialog

Reusable dialog with:

- **open**, **title**, **message** (ReactNode)
- **confirmLabel**, **cancelLabel** (defaults: "Confirm", "Cancel")
- **onConfirm**, **onCancel**
- **isDestructive** (default true): confirm button uses `color="error"` when true

## storage-api.ts

All functions take an **AuthenticatedFetch** as the first argument and use **STORAGE_API_URL** from config.

| Function                                          | Description                                                   |
| ------------------------------------------------- | ------------------------------------------------------------- |
| **upsertWorldValue**(fetch, key, value)           | PUT `/values/:key` with `{ value }` (string)                  |
| **deleteWorldValue**(fetch, key)                  | DELETE `/values/:key`                                         |
| **clearWorldStorage**(fetch)                      | DELETE `/values` with `X-Confirm-Delete-All: true`            |
| **upsertPlayerValue**(fetch, address, key, value) | PUT `/players/:address/values/:key` with `{ value }` (string) |
| **deletePlayerValue**(fetch, address, key)        | DELETE `/players/:address/values/:key`                        |
| **clearPlayerStorage**(fetch, address)            | DELETE `/players/:address/values` with header                 |
| **clearAllPlayersStorage**(fetch)                 | DELETE `/players` with header                                 |

Keys and addresses are encoded with **encodeURIComponent**.

## LoginPage, UnauthorizedPage, MissingParamsPage

- **LoginPage**: "Sign in required" message and Sign in button; button shows "Connecting…" when **isConnecting**. Calls **signIn()** from **useAuth**.
- **UnauthorizedPage**: "Access denied" message and "Go back" button (**window.history.back()**).
- **MissingParamsPage**: Explains that `realm` or `position` URL parameters are required (with examples).

## Dependencies

| Dependency                                            | Purpose                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `@/features/auth`                                     | useAuth (wallet, isSignedIn, signIn)                   |
| `@/features/permissions`                              | PermissionsProvider                                    |
| `@/lib/fetch`                                         | createAuthenticatedFetch                               |
| `@/config`                                            | STORAGE_API_URL                                        |
| decentraland-ui2                                      | Box, Button, Card, Tabs, TextField, Typography, Dialog |
| decentraland-crypto-fetch, @dcl/single-sign-on-client | Signed requests                                        |

## Usage

- To protect any route with realm/position + auth + permissions, wrap content in the same pattern as **StorageGate**: check params → check auth → **PermissionsProvider** → children.
- To add a new panel that uses signed storage API, pass **wallet** and **isSignedIn** from **useAuth** into RTK Query hooks; the feature's `*.client.ts` uses **createQueryFetch** inside the `queryFn`.
- For generic key/value forms, use **StorageForm** with custom labels and **onSubmit**.
- For destructive or important confirmations, use **ConfirmDialog** with **isDestructive** and clear **title**/**message**.
