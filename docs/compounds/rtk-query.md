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
2. Calls one of the fetch creators (see below) to get a `SignedFetch` function.
3. Builds the full URL (e.g. from `config.get('STORAGE_API_URL')`).
4. For GET/PUT/POST with JSON responses: calls `wrapSignedFetch(signedFetch, url, init)`.
5. For DELETE (204 No Content): calls `signedFetch` directly and checks `response.ok`.
6. Returns `{ data }` on success or `{ error: error as WrapSignedFetchError }` on failure.

**Examples**:

- [src/features/assets/assets.client.ts](src/features/assets/assets.client.ts) — `getContributableDomains` (signed fetch for worlds content server).
- [src/features/env/env.client.ts](src/features/env/env.client.ts) — all env endpoints.
- [src/features/scene/scene.client.ts](src/features/scene/scene.client.ts) — all scene endpoints.
- [src/features/player/player.client.ts](src/features/player/player.client.ts) — all player endpoints.

Components that use these hooks pass `wallet` and `isSignedIn` from `useAuth()` into every query and mutation. Use `skip: !wallet` on storage queries so they only run when the user can sign.

## Fetch Creators

There are **two** fetch creators for signed endpoints. Both return a `SignedFetch` function that you pass to `wrapSignedFetch`.

### `createQueryFetch(wallet, isSignedIn)`

Reads `realm` and `position` from `window.location.search` automatically. Use this when the URL params always match the query context (i.e. the component reads from the same URL the user is on).

```typescript
const signedFetch = createQueryFetch(wallet, isSignedIn)
const data = await wrapSignedFetch<MyResponse>(signedFetch, url)
```

**Used by**: scene, player, and assets (getContributableDomains).

### `createScopedQueryFetch(wallet, isSignedIn, realm, position)`

Takes explicit `realm` and `position` parameters instead of reading from the URL. Use this when the endpoint caches by realm/position and you need the cache key to match the actual scope — prevents data contamination if URL params change between renders.

```typescript
const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
const data = await wrapSignedFetch<MyResponse>(signedFetch, url)
```

**Used by**: env (all endpoints accept `realm` and `position` explicitly in the query args).

### When to use which

| Scenario                                        | Creator                  | Reason                               |
| ----------------------------------------------- | ------------------------ | ------------------------------------ |
| URL params always match query context           | `createQueryFetch`       | Simpler; reads params automatically  |
| Cache must be scoped to explicit realm/position | `createScopedQueryFetch` | Prevents stale data when URL changes |
| Non-signed public API                           | Neither (use `query`)    | Default `fetchBaseQuery` handles it  |

## Wrappers Reference

| Helper                                                        | Location      | Purpose                                                                                                                                  |
| ------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createQueryFetch(wallet, isSignedIn)`                        | `@/lib/fetch` | Returns a `SignedFetch` that reads realm/position from URL. Use inside `queryFn`.                                                        |
| `createScopedQueryFetch(wallet, isSignedIn, realm, position)` | `@/lib/fetch` | Returns a `SignedFetch` with explicit realm/position. Use inside `queryFn` when caching by scope.                                        |
| `wrapSignedFetch<T>(signedFetch, url, init)`                  | `@/lib/fetch` | Calls fetch, checks `response.ok`, parses JSON. Throws `WrapSignedFetchError`. Do **not** use for 204 No Content responses.              |
| `createAuthenticatedFetch(wallet, isSignedIn)`                | `@/lib/fetch` | Lower-level helper. Returns a fetch function that signs when authenticated, falls back to plain fetch. Used internally by both creators. |

## Mutation Patterns

### JSON response (PUT/POST)

Use `wrapSignedFetch` with method and body:

```typescript
const response = await wrapSignedFetch<StorageValueResponse>(signedFetch, `${baseUrl()}/values/${key}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ value })
})
return { data: response }
```

### 204 No Content (DELETE)

Call `signedFetch` directly and check `response.ok`:

```typescript
const response = await signedFetch(`${baseUrl()}/env/${key}`, { method: 'DELETE' })
if (!response.ok) {
  throw { status: response.status, data: await response.text().catch(() => undefined) }
}
return { data: undefined }
```

### DELETE with confirmation header

Some bulk-delete endpoints require `X-Confirm-Delete-All: true`:

```typescript
const response = await signedFetch(`${baseUrl()}/values`, {
  method: 'DELETE',
  headers: { 'X-Confirm-Delete-All': 'true' }
})
```

## Cache Key for Signed Endpoints

Endpoints that take `wallet` and `isSignedIn` use `serializeQueryArgs` so the cache key excludes auth state (which changes frequently). Serialize by `endpointName` and logical params only.

**Example** (list env keys — scoped by realm/position):

```typescript
serializeQueryArgs: ({ queryArgs, endpointName }) => ({
  endpointName,
  realm: queryArgs.realm,
  position: queryArgs.position
})
```

**Example** (list player keys — address matters):

```typescript
serializeQueryArgs: ({ queryArgs, endpointName }) => ({ endpointName, address: queryArgs.address })
```

**Example** (list scene keys — no extra params):

```typescript
serializeQueryArgs: ({ endpointName }) => ({ endpointName })
```

## Where Each Pattern Is Used

| Feature     | Endpoints                                                                                             | Pattern                          |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| assets      | `getUserLands`, `getUserRentals`, `getUserDCLNames`                                                   | baseQuery (subgraphs)            |
| assets      | `getContributableDomains`                                                                             | queryFn + createQueryFetch       |
| env         | All (listEnvKeys, setEnv, deleteEnv, clearEnv)                                                        | queryFn + createScopedQueryFetch |
| scene       | All (listSceneKeys, getSceneValue, setSceneValue, deleteSceneValue, clearScene)                       | queryFn + createQueryFetch       |
| player      | All (listPlayerKeys, getPlayerValue, setPlayerValue, deletePlayerValue, clearPlayer, clearAllPlayers) | queryFn + createQueryFetch       |
| permissions | Permissions endpoints                                                                                 | baseQuery                        |
