# Player Storage Feature

## Overview

The player feature manages **per-address JSON key-value storage**. Each player (wallet address) has a set of keys with JSON values. It exposes RTK Query endpoints for listing players, listing keys per player, getting/setting/deleting values, clearing one player's storage, and clearing all players. The `PlayerPage` component provides an accordion list of players with nested key tables and view/add/delete/clear dialogs.

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
| `listPlayers`       | `useListPlayersQuery`          | GET    | List all player addresses       |
| `listPlayerKeys`    | `useListPlayerKeysQuery`       | GET    | List keys for a player          |
| `getPlayerValue`    | `useGetPlayerValueQuery`       | GET    | Get value for a player+key      |
| `setPlayerValue`    | `useSetPlayerValueMutation`    | PUT    | Set value for a player+key      |
| `deletePlayerValue` | `useDeletePlayerValueMutation` | DELETE | Delete value for a player+key   |
| `clearPlayer`       | `useClearPlayerMutation`       | DELETE | Clear all values for one player |
| `clearAllPlayers`   | `useClearAllPlayersMutation`   | DELETE | Clear all player storage        |

Cache invalidation: `Player` and `PlayerKeys` tags; per-address `PlayerKeys` id; per-address:key for `getPlayerValue`.

## API Contract

| Action            | URL                                                     | Body / Headers                       |
| ----------------- | ------------------------------------------------------- | ------------------------------------ |
| List players      | `GET {STORAGE_API_URL}/players`                         | —                                    |
| List keys         | `GET {STORAGE_API_URL}/players/:address/values`         | —                                    |
| Get value         | `GET {STORAGE_API_URL}/players/:address/values/:key`    | —                                    |
| Set value         | `PUT {STORAGE_API_URL}/players/:address/values/:key`    | `{ value: unknown }` (JSON)          |
| Delete value      | `DELETE {STORAGE_API_URL}/players/:address/values/:key` | —                                    |
| Clear player      | `DELETE {STORAGE_API_URL}/players/:address/values`      | Header: `X-Confirm-Delete-All: true` |
| Clear all players | `DELETE {STORAGE_API_URL}/players`                      | Header: `X-Confirm-Delete-All: true` |

## PlayerPage Component

- **Loading**: Shows a centered `CircularProgress` while players list is loading.
- **Accordion**: One accordion per player; summary shows address; details show a "Clear Player" button and a nested table of keys.
- **PlayerKeysTable**: Per-player table with Key and actions (View, Delete); uses `useListPlayerKeysQuery({ address })`.
- **View**: Opens a dialog that fetches the value with `useGetPlayerValueQuery({ address, key })` and displays formatted JSON.
- **Add**: Button opens a dialog with Player Address, Key, and Value (JSON); Save parses JSON and calls `setPlayerValue`, then refetches players.
- **Delete**: Per-row delete opens a confirmation dialog; Confirm calls `deletePlayerValue` and refetches.
- **Clear Player**: Per-accordion "Clear Player" opens a confirmation dialog; Confirm calls `clearPlayer({ address })` and refetches.
- **Clear All Players**: Top-level button (only when there are players) opens a confirmation dialog; Confirm calls `clearAllPlayers` and refetches.
- **Empty state**: When there are no players, shows "No players found".

## Clearing Strategies

| Action            | Effect                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| Clear Player      | Deletes all keys for one address; invalidates `Player` and `PlayerKeys`. |
| Clear All Players | Deletes all player data; invalidates `Player` and `PlayerKeys`.          |

## Usage

### Hooks

```typescript
import {
  useListPlayersQuery,
  useListPlayerKeysQuery,
  useGetPlayerValueQuery,
  useSetPlayerValueMutation,
  useDeletePlayerValueMutation,
  useClearPlayerMutation,
  useClearAllPlayersMutation
} from '@/features/player'

const MyComponent = () => {
  const { data: players } = useListPlayersQuery()
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
