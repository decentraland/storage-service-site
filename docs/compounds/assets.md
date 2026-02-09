# Assets Feature

## Overview

The assets feature lets users **select a world or land** to manage storage when they have no `realm` or `position` in the URL. It fetches the user's lands (parcels/estates from the Land Manager subgraph), DCL names (from the Marketplace subgraph), and contributable domains (worlds where the user has deployment permission from the Worlds Content Server). **AssetSelectorPage** shows these as cards; selecting a world navigates to `/env?realm=...`, selecting a land navigates to `/env?position=x,y`.

## Dependencies

| Dependency                          | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| RTK Query (via `@/services/client`) | Data fetching and caching                                               |
| `@/config`                          | `WORLDS_CONTENT_SERVER_URL` (contributable domains)                     |
| `@/features/auth`                   | `useAuth().wallet` to scope queries                                     |
| `@/hooks/useSignedFetch`            | Signed fetch for `getContributableDomains` (caller passes in query arg) |
| Land Manager subgraph               | User's parcels/estates (owned, operator)                                |
| Marketplace subgraph                | User's ENS/DCL names                                                    |
| Worlds Content Server               | `GET /wallet/contribute` (contributable domains)                        |

## Key Files

```
src/features/assets/
├── index.ts              # Public exports
├── assets.client.ts      # RTK Query endpoints
├── assets.types.ts       # Land, World, ContributableDomain, subgraph types
├── assets.utils.ts       # getLandQuery, transformLandQueryResult, getLandPosition, getRoleLabel
└── components/
    ├── AssetSelectorPage.tsx  # Main selector UI
    ├── LandCard.tsx           # Card for parcel/estate
    ├── WorldCard.tsx          # Card for world
    └── index.ts
```

## RTK Query Endpoints

| Endpoint                  | Hook                              | Description                                                                                                                                                             |
| ------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getUserLands`            | `useGetUserLandsQuery`            | POST to Land Manager subgraph; returns `Land[]` (parcels + estates, owned + operator)                                                                                   |
| `getUserDCLNames`         | `useGetUserDCLNamesQuery`         | POST to Marketplace subgraph; returns `string[]` (e.g. `myworld.dcl.eth`)                                                                                               |
| `getContributableDomains` | `useGetContributableDomainsQuery` | GET `{WORLDS_CONTENT_SERVER_URL}/wallet/contribute` (signed); returns `ContributableDomain[]`. Caller must pass `signedFetch` from `useSignedFetch()` in the query arg. |

Tags: `UserLands`, `UserDCLNames`, `ContributableDomains`.

## Types

- **Land**: `id`, `tokenId`, `type` (parcel/estate), `role` (OWNER, OPERATOR, etc.), `x`/`y` (parcel) or `parcels` (estate), `name`, `description`, `owner`, `operators`.
- **World**: `name`, `role` (`owner` | `collaborator`).
- **ContributableDomain**: `name`, `userPermissions`, `size`, `owner` (transformed from API `user_permissions`).

## AssetSelectorPage

- Uses **useAuth().wallet** and **useSignedFetch()**; skips all queries if no wallet.
- Passes **signedFetch** into **getContributableDomains** so the contribute request is signed.
- Combines **getUserDCLNames** (owner) and **getContributableDomains** (collaborator) into **allWorlds** (deduplicated by name).
- Renders "Select Asset to Manage", then **Worlds** (WorldCard per world) and **Lands** (LandCard per land).
- **handleSelectWorld(name)** → `navigate(\`/env?realm=${name}\`)`.
- **handleSelectLand(land)** → uses **getLandPosition(land)** (parcel `x,y` or first parcel of estate) → `navigate(\`/env?position=${x},${y}\`)`.
- Loading: single centered **CircularProgress**.

## Utils

- **getLandQuery()**: GraphQL query for Land Manager subgraph (owner/operator parcels and estates).
- **transformLandQueryResult(data)**: Maps subgraph result to `Land[]` (parcelToLand, estateToLand; dedup by id).
- **getLandPosition(land)**: Returns `"x,y"` for parcel, or first parcel coords for estate; null if none.
- **getRoleLabel(role)**: Human-readable role (e.g. Owner, Operator).

## Configuration

Subgraph URLs are hardcoded in `assets.client.ts`: Land Manager and Marketplace. Contributable domains use **WORLDS_CONTENT_SERVER_URL** from config. Optional env entries: **LAND_MANAGER_SUBGRAPH**, **MARKETPLACE_SUBGRAPH** (see `src/config/env/dev.json`).

## Usage

- **SelectPage** (`src/pages/Select/SelectPage.tsx`) renders **AssetSelectorPage**; route `/select` is used by **RootRedirect** when root has no realm/position.
- To test asset selector, use **server.use(...)** with `assets.handlers.ts` and/or `subgraphs.handlers.ts`; they are not in the default MSW handler list.
