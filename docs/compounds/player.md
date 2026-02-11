# Player Storage Feature

## Overview

The player feature manages **per-address JSON key-value storage**. Each player (wallet address) has a set of keys with JSON values. It exposes RTK Query endpoints for listing keys per player, getting/setting/deleting values, clearing one player's storage, and clearing all players. The `PlayerPage` component lets the user enter a player address to load and manage that player's keys with edit, add, delete, and clear actions (the World Storage Service OpenAPI does not define GET /players; only per-address list is available).

## Dependencies

| Dependency                          | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| RTK Query (via `@/services/client`) | Data fetching and caching                                 |
| `@/config`                          | `STORAGE_API_URL` for API base                            |
| MUI (Material-UI)                   | Accordion, Table, Dialog, Button, TextField in PlayerPage |

## Key Files

```
src/features/player/
├── index.ts           # Public exports
├── player.client.ts   # RTK Query endpoints
├── player.types.ts    # TypeScript interfaces
└── components/
    ├── PlayerPage.tsx # Main UI component
    └── index.ts      # Component barrel
```

## Types

```typescript
interface PlayerAddress {
  address: string
}

interface PlayerKey {
  key: string
}

interface PlayerValue {
  key: string
  value: unknown
}

interface ListPlayerKeysParams {
  address: string
}

interface GetPlayerValueParams {
  address: string
  key: string
}

interface SetPlayerValueParams {
  address: string
  key: string
  value: unknown
}

interface DeletePlayerValueParams {
  address: string
  key: string
}

interface ClearPlayerParams {
  address: string
}
```

## RTK Query Endpoints

| Endpoint            | Hook                           | Method | Description                     |
| ------------------- | ------------------------------ | ------ | ------------------------------- |
| `listPlayerKeys`    | `useListPlayerKeysQuery`       | GET    | List keys for a player          |
| `getPlayerValue`    | `useGetPlayerValueQuery`       | GET    | Get value for a player+key      |
| `setPlayerValue`    | `useSetPlayerValueMutation`    | PUT    | Set value for a player+key      |
| `deletePlayerValue` | `useDeletePlayerValueMutation` | DELETE | Delete value for a player+key   |
| `clearPlayer`       | `useClearPlayerMutation`       | DELETE | Clear all values for one player |
| `clearAllPlayers`   | `useClearAllPlayersMutation`   | DELETE | Clear all player storage        |

Cache invalidation: `Player` and `PlayerKeys` tags; per-address `PlayerKeys` id; per-address:key for `getPlayerValue`.

## API Contract

Aligned with [World Storage Service OpenAPI](https://github.com/decentraland/world-storage-service/blob/main/docs/openapi.yaml). There is no GET /players endpoint; list keys per address only.

| Action            | URL                                                     | Body / Headers                        |
| ----------------- | ------------------------------------------------------- | ------------------------------------- |
| List keys         | `GET {STORAGE_API_URL}/players/:address/values`         | Optional: `limit`, `offset`, `prefix` |
| Get value         | `GET {STORAGE_API_URL}/players/:address/values/:key`    | —                                     |
| Set value         | `PUT {STORAGE_API_URL}/players/:address/values/:key`    | `{ value: unknown }` (JSON)           |
| Delete value      | `DELETE {STORAGE_API_URL}/players/:address/values/:key` | —                                     |
| Clear player      | `DELETE {STORAGE_API_URL}/players/:address/values`      | Header: `X-Confirm-Delete-All: true`  |
| Clear all players | `DELETE {STORAGE_API_URL}/players`                      | Header: `X-Confirm-Delete-All: true`  |

List responses use OpenAPI shape `{ data, pagination }`; the client transforms to the hook types.

## PlayerPage Component

- **Enter address**: User types a player address and clicks "Load keys"; the page then shows keys for that address (no GET /players in OpenAPI).
- **PlayerKeysSection**: When an address is loaded, shows a table of keys with Edit, Delete, and "Clear this player"; uses `useListPlayerKeysQuery({ address })`.
- **Edit**: Per-row edit icon opens a dialog that fetches the value with `useGetPlayerValueQuery({ address, key })` and displays it in an editable TextField; Save parses JSON and calls `setPlayerValue`, then refetches. Invalid JSON shows a validation error.
- **Add**: Button opens a dialog with Player Address, Key, and Value (JSON); Save calls `setPlayerValue`; cache invalidates for that address.
- **Delete**: Per-row delete opens a confirmation dialog; Confirm calls `deletePlayerValue`.
- **Clear this player**: In the keys section, opens a confirmation dialog; Confirm calls `clearPlayer({ address })`.
- **Clear All Players**: Top-level button opens a confirmation dialog; Confirm calls `clearAllPlayers`.
- **Empty state**: When no address is loaded, shows "Enter a player address to view or manage their key-value storage."
- **i18n**: All user-facing strings use `useTranslation()` from `@dcl/hooks`.

## Clearing Strategies

| Action            | Effect                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| Clear Player      | Deletes all keys for one address; invalidates `Player` and `PlayerKeys`. |
| Clear All Players | Deletes all player data; invalidates `Player` and `PlayerKeys`.          |

## Usage

### Hooks

```typescript
import {
  useListPlayerKeysQuery,
  useGetPlayerValueQuery,
  useSetPlayerValueMutation,
  useDeletePlayerValueMutation,
  useClearPlayerMutation,
  useClearAllPlayersMutation
} from '@/features/player'

const MyComponent = () => {
  const { data: keys } = useListPlayerKeysQuery({ address: '0x...' })
  const { data: value } = useGetPlayerValueQuery({ address: '0x...', key: 'inventory' })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()
  const [clearAllPlayers] = useClearAllPlayersMutation()

  // setPlayerValue({ address: '0x...', key: 'progress', value: { level: 5 } })
  // clearPlayer({ address: '0x...' })
  // clearAllPlayers()
}
```

### Page

```typescript
import { PlayerPage } from '@/features/player'

<Route path="players" element={<PlayerPage />} />
```

## Testing

MSW uses **storage-api.handlers.ts** (unified env/world/players handlers). Player list/keys/values and clear are mocked there under `/players`; no separate player.handlers.

## Configuration

| Config Key        | Purpose                         |
| ----------------- | ------------------------------- |
| `STORAGE_API_URL` | Base URL for player storage API |

See `src/config/env/dev.json` (and stg/prd) for values.
