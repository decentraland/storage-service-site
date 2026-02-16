# RTK Query and Signed Fetch

## Overview

The app uses a single RTK Query API slice for all server state. Endpoints either use the default `baseQuery` (plain fetch) or a custom `queryFn` with signed fetch for APIs that require ADR-44 authentication (e.g. World Storage Service).

## Setup

- **API slice**: [src/services/client.ts](src/services/client.ts) creates the `client` with `fetchBaseQuery`, shared `tagTypes`, and empty `endpoints: () => ({})`.
- **Store**: [src/app/store.ts](src/app/store.ts) wires `client.reducer` and `client.middleware`. Features inject endpoints via `client.injectEndpoints` in their `*.client.ts` files.

## Two Request Patterns

### 1. Default baseQuery (public APIs)

Endpoints that use `query: () => ({ url, method, body })` go through the default `fetchBaseQuery`. Use for public APIs that do not require signed fetch (e.g. subgraphs, permissions).

**Example**: `getUserLands`, `getUserDCLNames` in [src/features/assets/assets.client.ts](src/features/assets/assets.client.ts).

### 2. Signed fetch (custom queryFn)

Endpoints that require ADR-44 signed fetch **must not** use the default baseQuery. Use a `queryFn` that:

1. Receives `wallet` and `isSignedIn` in the argument (along with any other params).
2. Calls `createQueryFetch(wallet, isSignedIn)` at the top of the `queryFn` to get a fetch function (realm/position metadata is read from `window.location.search` internally).
3. Builds the full URL (e.g. from `config.get('STORAGE_API_URL')`).
4. Calls `wrapSignedFetch(signedFetch, url, init)` for GET or for PUT/POST with JSON body; for mutations that return 204 No Content, call `signedFetch` directly and check `response.ok`.
5. Returns `{ data }` on success or `{ error: error as WrapSignedFetchError }` on failure.

**Examples**:

- [src/features/assets/assets.client.ts](src/features/assets/assets.client.ts) — `getContributableDomains` (signed fetch for worlds content server).
- [src/features/env/env.client.ts](src/features/env/env.client.ts) — all env endpoints.
- [src/features/scene/scene.client.ts](src/features/scene/scene.client.ts) — all scene endpoints.
- [src/features/player/player.client.ts](src/features/player/player.client.ts) — all player endpoints.

Components that use these hooks pass `wallet` and `isSignedIn` from `useAuth()` into every query and mutation. Use `skip: !wallet` on storage queries so they only run when the user can sign.

## Wrappers

| Helper                                         | Location      | Purpose                                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createQueryFetch(wallet, isSignedIn)`         | `@/lib/fetch` | Use inside RTK Query `queryFn`. Returns a SignedFetch that reads realm/position from `window.location.search` and uses signed fetch when authenticated. Call at the top of each `queryFn`, then pass the result to `wrapSignedFetch`.                                       |
| `wrapSignedFetch(signedFetch, url, init)`      | `@/lib/fetch` | Performs the request, checks `response.ok`, parses JSON. Throws an object compatible with RTK Query error handling (`{ status, data }` or `{ status: 'FETCH_ERROR', error }`). Do not use for 204 No Content responses; use `signedFetch` directly and check `response.ok`. |
| `createAuthenticatedFetch(wallet, isSignedIn)` | `@/lib/fetch` | Lower-level helper. Returns a fetch-like function that uses signed fetch when signed in with valid identity, otherwise falls back to plain fetch. Used internally by `createQueryFetch`.                                                                                    |

## Cache Key for Signed Endpoints

Endpoints that take `wallet` and `isSignedIn` use `serializeQueryArgs` so the cache key excludes auth state (which changes frequently). Serialize by `endpointName` and logical params only (e.g. `address` for `listPlayerKeys`).

**Example** (list env keys — no other params):

```typescript
serializeQueryArgs: ({ endpointName }) => ({ endpointName })
```

**Example** (list player keys — address matters):

```typescript
serializeQueryArgs: ({ queryArgs, endpointName }) => ({ endpointName, address: queryArgs.address })
```

## Where Each Pattern Is Used

| Feature     | Endpoints                                                                                             | Pattern                    |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------- |
| assets      | `getUserLands`, `getUserDCLNames`                                                                     | baseQuery (subgraphs)      |
| assets      | `getContributableDomains`                                                                             | queryFn + createQueryFetch |
| env         | All (listEnvKeys, setEnv, deleteEnv, clearEnv)                                                        | queryFn + createQueryFetch |
| scene       | All (listSceneKeys, getSceneValue, setSceneValue, deleteSceneValue, clearScene)                       | queryFn + createQueryFetch |
| player      | All (listPlayerKeys, getPlayerValue, setPlayerValue, deletePlayerValue, clearPlayer, clearAllPlayers) | queryFn + createQueryFetch |
| permissions | Permissions endpoints                                                                                 | baseQuery                  |
