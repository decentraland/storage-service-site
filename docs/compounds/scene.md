# Scene Storage Feature

## Overview

The scene feature manages **JSON key-value storage** for a world or parcel (scene storage). It exposes RTK Query endpoints for listing keys, getting a value by key, setting a value, deleting by key, and clearing all. Values are arbitrary JSON. The `ScenePage` component provides a table UI with edit (fetches value into an editable TextField), add, delete, and clear-all dialogs.

## Dependencies

| Dependency                          | Purpose                                       |
| ----------------------------------- | --------------------------------------------- |
| RTK Query (via `@/services/client`) | Data fetching and caching                     |
| `@/config`                          | `STORAGE_API_URL` for API base                |
| MUI (Material-UI)                   | Table, Dialog, Button, TextField in ScenePage |

## Key Files

```
src/features/scene/
├── index.ts           # Public exports
├── scene.client.ts    # RTK Query endpoints
├── scene.types.ts     # TypeScript interfaces
└── components/
    ├── ScenePage.tsx  # Main UI component
    └── index.ts      # Component barrel
```

## Types

```typescript
interface SceneKey {
  key: string
}

interface SceneValue {
  key: string
  value: unknown
}

interface GetSceneValueParams {
  key: string
}

interface SetSceneValueParams {
  key: string
  value: unknown
}

interface DeleteSceneValueParams {
  key: string
}
```

## RTK Query Endpoints

| Endpoint           | Hook                          | Method | Description                |
| ------------------ | ----------------------------- | ------ | -------------------------- |
| `listSceneKeys`    | `useListSceneKeysQuery`       | GET    | List all scene keys        |
| `getSceneValue`    | `useGetSceneValueQuery`       | GET    | Get value for a key        |
| `setSceneValue`    | `useSetSceneValueMutation`    | PUT    | Set value for a key (JSON) |
| `deleteSceneValue` | `useDeleteSceneValueMutation` | DELETE | Delete value by key        |
| `clearScene`       | `useClearSceneMutation`       | DELETE | Clear all scene values     |

All mutations invalidate the `Scene` tag; `getSceneValue` uses tag `{ type: 'Scene', id: key }` for per-key caching.

## API Contract

| Action     | URL                                    | Body / Headers                       |
| ---------- | -------------------------------------- | ------------------------------------ |
| List keys  | `GET {STORAGE_API_URL}/values`         | —                                    |
| Get value  | `GET {STORAGE_API_URL}/values/:key`    | —                                    |
| Set value  | `PUT {STORAGE_API_URL}/values/:key`    | `{ value: unknown }` (JSON)          |
| Delete key | `DELETE {STORAGE_API_URL}/values/:key` | —                                    |
| Clear all  | `DELETE {STORAGE_API_URL}/values`      | Header: `X-Confirm-Delete-All: true` |

## ScenePage Component

- **Loading**: Shows a centered `CircularProgress` while keys are loading.
- **Table**: Renders key with Edit and Delete actions per row.
- **Edit**: Per-row edit icon opens a dialog that fetches the value with `useGetSceneValueQuery` and displays it in an editable TextField; Save parses JSON and calls `setSceneValue`, then refetches. Invalid JSON shows a validation error.
- **Add**: Button opens a dialog with Key and Value (JSON) text fields; Save parses JSON and calls `setSceneValue`, then refetches. Invalid JSON shows a validation error.
- **Delete**: Per-row delete icon opens a confirmation dialog; Confirm calls `deleteSceneValue` and refetches.
- **Clear All**: Button (only when there are keys) opens a confirmation dialog; Confirm calls `clearScene` and refetches.
- **Empty state**: When there are no keys, shows "No scene values found".
- **i18n**: All user-facing strings use `useTranslation()` from `@dcl/hooks`.

## JSON Parsing / Validation

When adding or editing a value, the form expects valid JSON in the Value field. `handleSaveValue` uses `JSON.parse(newValue.trim())`. If parsing throws, a validation error is shown in the dialog and the mutation is not called.

## Usage

### Hooks

```typescript
import {
  useListSceneKeysQuery,
  useGetSceneValueQuery,
  useSetSceneValueMutation,
  useDeleteSceneValueMutation,
  useClearSceneMutation
} from '@/features/scene'

const MyComponent = () => {
  const { data: keys } = useListSceneKeysQuery()
  const { data: value } = useGetSceneValueQuery({ key: 'gameState' })
  const [setSceneValue] = useSetSceneValueMutation()
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

  // setSceneValue({ key: 'settings', value: { difficulty: 'hard' } })
  // deleteSceneValue({ key: 'settings' })
  // clearScene()
}
```

### Page

```typescript
import { ScenePage } from '@/features/scene'

<Route path="scene" element={<ScenePage />} />
```

## Testing

MSW uses **storage-api.handlers.ts** (unified env/world/players handlers). Scene (world) values are mocked there under `/values` and `/values/:key`; no separate scene.handlers.

## Configuration

| Config Key        | Purpose                        |
| ----------------- | ------------------------------ |
| `STORAGE_API_URL` | Base URL for scene storage API |

See `src/config/env/dev.json` (and stg/prd) for values.
