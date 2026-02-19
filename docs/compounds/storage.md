# Storage UI Integration Layer

## Overview

The storage UI layer ties together auth, permissions, and storage features. The **current route flow** uses **RootRedirect** at `/`: no `realm`/`position` → redirect to **SelectPage** (asset selector); with params → redirect to `/env` with params. Env, Scene, and Players are direct routes. The **Layout** component conditionally renders a **Sidebar** (collapsible navigation drawer) on storage routes (`/env`, `/scene`, `/players`). Shared components: **StorageForm**, **ConfirmDialog**. Requests to the storage API use signed fetch when the user is authenticated (via `createQueryFetch` or `createScopedQueryFetch` in RTK Query endpoints).

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
        Layout renders Sidebar on these routes
```

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
src/App.tsx               # AppContent: conditionally renders Sidebar on storage routes

src/routes/
└── routes.tsx            # RootRedirect, AppRoutes; /, /select, /env, /scene, /players

src/pages/Select/
└── SelectPage.tsx        # Wraps AssetSelectorPage (assets feature)

src/pages/Env/
└── Env.tsx               # Thin wrapper rendering EnvPage (env feature)

src/pages/Scene/
└── Scene.tsx             # Thin wrapper rendering ScenePage (scene feature)

src/pages/Players/
└── Players.tsx           # Thin wrapper rendering PlayerPage (player feature)

src/pages/Login/
└── LoginPage.tsx         # Sign-in CTA; uses useAuth().signIn

src/pages/Unauthorized/
└── UnauthorizedPage.tsx  # "Access denied" + Go back

src/pages/MissingParams/
└── MissingParamsPage.tsx # Instructions for realm/position params

src/components/Layout/
└── Layout.tsx            # Shell: Navbar + optional sidebar + content area + Footer

src/components/Sidebar/
├── Sidebar.tsx           # Collapsible persistent/mini Drawer with nav items
└── Sidebar.styled.ts     # Styled components for the Sidebar

src/components/StorageForm/
└── StorageForm.tsx       # Reusable key + value form; configurable labels/placeholders

src/components/ConfirmDialog/
└── ConfirmDialog.tsx     # Reusable confirmation dialog; optional destructive styling

src/lib/
└── fetch.ts              # createQueryFetch, createScopedQueryFetch, wrapSignedFetch
```

## Layout + Sidebar Integration

The **Layout** component (`src/components/Layout/Layout.tsx`) renders the app shell: Navbar, optional sidebar, content area, and Footer. It accepts an optional `sidebar` prop:

- When `sidebar` is provided, Layout renders a flex row with the sidebar on the left and the content area on the right.
- When `sidebar` is omitted, Layout renders the content area without a sidebar.

**AppContent** (`src/App.tsx`) determines whether to show the Sidebar based on the current route:

```typescript
const STORAGE_ROUTES = ['/env', '/scene', '/players']
const isStorageRoute = STORAGE_ROUTES.includes(location.pathname)

<Layout sidebar={isStorageRoute ? <Sidebar /> : undefined}>
  <AppRoutes />
</Layout>
```

## Sidebar

A collapsible persistent/mini MUI Drawer (`src/components/Sidebar/Sidebar.tsx`) that provides navigation between storage pages:

- **Nav items**: Storages (`/select`), Environment variables (`/env`), Scene storage (`/scene`), Player storage (`/players`).
- **Collapse/expand**: Toggles between a mini (icons-only, 56px) and a full-width (240px) state with labels. Collapse state is persisted to `localStorage`.
- **Asset label**: When expanded, displays the current `realm` or `position` from URL params in the header.
- **Param preservation**: Storage nav items (`/env`, `/scene`, `/players`) preserve query params when navigating; the Storages item (`/select`) does not.
- Uses React Router's `useNavigate` and `useLocation` to highlight the active route.

## i18n

All user-facing strings across storage pages use `useTranslation()` from `@dcl/hooks`. Translations are defined in `src/intl/en.json`. The `TranslationProvider` is set up in `App.tsx` wrapping the entire app.

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

## LoginPage, UnauthorizedPage, MissingParamsPage

- **LoginPage**: "Sign in required" message and Sign in button; button shows "Connecting…" when **isConnecting**. Calls **signIn()** from **useAuth**.
- **UnauthorizedPage**: "Access denied" message and "Go back" button (**window.history.back()**).
- **MissingParamsPage**: Explains that `realm` or `position` URL parameters are required (with examples).

## Dependencies

| Dependency                                            | Purpose                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `@/features/auth`                                     | useAuth (wallet, isSignedIn, signIn)                 |
| `@/features/permissions`                              | PermissionsProvider                                  |
| `@/lib/fetch`                                         | createQueryFetch, createScopedQueryFetch             |
| `@/config`                                            | STORAGE_API_URL                                      |
| decentraland-ui2                                      | Box, Button, Container, Dialog, Navbar, Footer, etc. |
| decentraland-crypto-fetch, @dcl/single-sign-on-client | Signed requests                                      |

## Usage

- To add a new storage page, create the feature under `src/features/`, add a thin page wrapper in `src/pages/`, add a route in `routes.tsx`, and add the path to `STORAGE_ROUTES` in `App.tsx` so the Sidebar renders.
- To add a new panel that uses signed storage API, pass **wallet** and **isSignedIn** from **useAuth** into RTK Query hooks; the feature's `*.client.ts` uses **createQueryFetch** or **createScopedQueryFetch** inside the `queryFn`.
- For generic key/value forms, use **StorageForm** with custom labels and **onSubmit**.
- For destructive or important confirmations, use **ConfirmDialog** with **isDestructive** and clear **title**/**message**.
