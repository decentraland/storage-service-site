# Environment Variables Feature

## Overview

The env feature manages **environment variables** for a world or parcel. It exposes RTK Query endpoints for listing keys, setting values, deleting by key, and clearing all. Values are plain strings. The `EnvPage` component provides a table UI with add, delete, and clear-all dialogs.

## Dependencies

| Dependency                          | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| RTK Query (via `@/services/client`) | Data fetching and caching                   |
| `@/config`                          | `STORAGE_API_URL` for API base              |
| MUI (Material-UI)                   | Table, Dialog, Button, TextField in EnvPage |

## Key Files

```
src/features/env/
├── index.ts           # Public exports
├── env.client.ts      # RTK Query endpoints
├── env.types.ts       # TypeScript interfaces
└── components/
    ├── EnvPage.tsx    # Main UI component
    └── index.ts       # Component barrel
```

## Types

```typescript
interface EnvKey {
  key: string
}

interface SetEnvParams {
  key: string
  value: string
}

interface DeleteEnvParams {
  key: string
}

interface EnvValue {
  key: string
  value: string
}
```

## RTK Query Endpoints

| Endpoint      | Hook                   | Method | Description             |
| ------------- | ---------------------- | ------ | ----------------------- |
| `listEnvKeys` | `useListEnvKeysQuery`  | GET    | List all env keys       |
| `setEnv`      | `useSetEnvMutation`    | PUT    | Set env value for a key |
| `deleteEnv`   | `useDeleteEnvMutation` | DELETE | Delete env value by key |
| `clearEnv`    | `useClearEnvMutation`  | DELETE | Clear all env variables |

All mutations invalidate the `Env` tag so the keys list refetches automatically.

## API Contract

| Action     | URL                                 | Body / Headers                       |
| ---------- | ----------------------------------- | ------------------------------------ |
| List keys  | `GET {STORAGE_API_URL}/env`         | —                                    |
| Get value  | `GET {STORAGE_API_URL}/env/:key`    | —                                    |
| Set value  | `PUT {STORAGE_API_URL}/env/:key`    | `{ value: string }`                  |
| Delete key | `DELETE {STORAGE_API_URL}/env/:key` | —                                    |
| Clear all  | `DELETE {STORAGE_API_URL}/env`      | Header: `X-Confirm-Delete-All: true` |

## EnvPage Component

- **Loading**: Shows a centered `CircularProgress` while keys are loading.
- **Table**: Renders key with Edit and Delete actions per row.
- **Edit**: Per-row edit icon opens a dialog and allows editing; Save calls `setEnv` and refetches.
- **Add**: Button opens a dialog with Key and Value text fields; Save calls `setEnv` and refetches.
- **Delete**: Per-row delete icon opens a confirmation dialog; Confirm calls `deleteEnv` and refetches.
- **Clear All**: Button (only when there are keys) opens a confirmation dialog; Confirm calls `clearEnv` and refetches.
- **Empty state**: When there are no keys, shows "No environment variables found".
- **i18n**: All user-facing strings use `useTranslation()` from `@dcl/hooks`.

## Usage

### Hooks

```typescript
import { useListEnvKeysQuery, useSetEnvMutation, useDeleteEnvMutation, useClearEnvMutation } from '@/features/env'

const MyComponent = () => {
  const { data: envKeys, isLoading, refetch } = useListEnvKeysQuery()
  const [setEnv] = useSetEnvMutation()
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()

  // setEnv({ key: 'API_KEY', value: 'secret' })
  // deleteEnv({ key: 'API_KEY' })
  // clearEnv()
}
```

### Page

```typescript
import { EnvPage } from '@/features/env'

<Route path="env" element={<EnvPage />} />
```

## Testing

MSW uses **storage-api.handlers.ts** (unified env/world/players handlers). Env list/set/delete/clear are mocked there; no separate env.handlers.

## Configuration

| Config Key        | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `STORAGE_API_URL` | Base URL for env API (e.g. Worlds Content Server) |

See `src/config/env/dev.json` (and stg/prd) for values.
