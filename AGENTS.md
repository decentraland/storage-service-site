# AI Agent Instructions

## Project Overview

Storage Service UI - A Decentraland dApp for managing World and Player storage (environment variables, scene data, player data).

## Compound Documents

Before making changes, read the relevant compound docs in `docs/compounds/`:

| Document                                          | When to Read                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| [architecture.md](docs/compounds/architecture.md) | Understanding project structure, providers, folder conventions     |
| [auth.md](docs/compounds/auth.md)                 | Working with authentication, wallet connection, identity           |
| [testing.md](docs/compounds/testing.md)           | Writing tests, MSW handlers, Vitest configuration                  |
| [permissions.md](docs/compounds/permissions.md)   | Working with realm/parcel permission checks, PermissionsProvider   |
| [env.md](docs/compounds/env.md)                   | Working with environment variables storage feature                 |
| [scene.md](docs/compounds/scene.md)               | Working with scene (world) JSON storage feature                    |
| [player.md](docs/compounds/player.md)             | Working with per-player JSON storage feature                       |
| [storage.md](docs/compounds/storage.md)           | Storage UI pages, shared components, hooks, signed fetch           |
| [assets.md](docs/compounds/assets.md)             | Asset selector (lands, worlds), SelectPage, subgraphs              |
| [rtk-query.md](docs/compounds/rtk-query.md)       | Adding or changing API endpoints, signed fetch, RTK Query patterns |

## Code Conventions

### Features Pattern

- Features are self-contained modules in `src/features/`
- Only import from feature's `index.ts` barrel file
- Each feature has: types, utils, components, tests

```typescript
// ✅ Correct
import { useAuth, AuthProvider } from '@/features/auth'

// ❌ Wrong
import { useAuth } from '@/features/auth/AuthProvider'
```

### Component Structure

```
src/features/[feature]/
├── index.ts           # Public exports only
├── [Feature].tsx      # Main component
├── [feature].types.ts # TypeScript interfaces
├── [feature].utils.ts # Pure utility functions
└── [feature].test.ts  # Tests
```

### Naming Conventions

- Components: PascalCase (`AuthProvider.tsx`)
- Types/Interfaces: PascalCase with descriptive suffix (`AuthContextValue`, `AuthConfig`)
- Utilities: camelCase (`buildRedirectUrl`, `isIdentityValid`)
- Event handlers: `handle` prefix (`handleClickSignIn`)
- Test files: `.test.ts` or `.test.tsx` suffix

## Testing Standards

Follow Decentraland testing patterns:

```typescript
describe('when [condition]', () => {
  beforeEach(() => {
    /* setup */
  })

  describe('and [sub-condition]', () => {
    it('should [expected behavior]', () => {
      expect(result).toBe(expected)
    })
  })
})
```

## Key Dependencies

| Package                    | Version | Notes                        |
| -------------------------- | ------- | ---------------------------- |
| @dcl/single-sign-on-client | 0.1.0   | **Must be v0.1.0**, not v2.x |
| decentraland-connect       | ^7.2.0  | Wallet connection            |
| decentraland-crypto-fetch  | ^1.0.2  | Signed requests              |
| decentraland-ui2           | ^0.15.0 | UI components                |

## Common Tasks

### Adding a New Feature

1. Create folder: `src/features/[feature]/`
2. Create files: `index.ts`, `[feature].types.ts`, `[feature].utils.ts`
3. Write tests first (TDD)
4. Implement feature
5. Export from `index.ts`
6. Update compound doc if significant

### Adding API Endpoints

- **Public / non-signed APIs** (subgraphs, permissions, etc.): Add endpoints via `client.injectEndpoints` in the feature's `*.client.ts` with the standard `query` that returns `{ url, method, body }`. These use the default `baseQuery` in [src/services/client.ts](src/services/client.ts). Add MSW handlers in `src/test/handlers/`.
- **Signed-fetch APIs** (World Storage Service and any ADR-44–protected API): Add endpoints that accept `wallet` and `isSignedIn` in the query or mutation argument. Inside the `queryFn`, call `createQueryFetch(wallet, isSignedIn)` to get a fetch function, then use `wrapSignedFetch(signedFetch, url, init)` from `@/lib/fetch`. Components pass `wallet` and `isSignedIn` from `useAuth()` into every query and mutation. See [docs/compounds/rtk-query.md](docs/compounds/rtk-query.md) and the env, scene, player, and assets clients for examples.

### RTK Query and signed fetch

- Single API slice: one `client` in [src/services/client.ts](src/services/client.ts); features inject endpoints via `client.injectEndpoints`.
- **Wrappers**: `createQueryFetch(wallet, isSignedIn)` (called inside `queryFn`; reads realm/position from URL), `wrapSignedFetch(signedFetch, url, init)` (used inside RTK Query `queryFn` for signed requests; returns parsed JSON or throws `WrapSignedFetchError`). Pass `wallet` and `isSignedIn` from `useAuth()` into hooks; use `createQueryFetch` + `wrapSignedFetch` inside `queryFn` when the endpoint requires signed fetch.
- For signed endpoints, use `serializeQueryArgs` so the cache key excludes auth state (e.g. serialize by `endpointName` and logical params like `address`).

### Modifying Auth Flow

1. Read `docs/compounds/auth.md` first
2. Check `sites` reference implementation (the `/jump` route) if needed
3. Test with actual auth flow (not just unit tests)

### Adding Storage Operations

1. Read [storage.md](docs/compounds/storage.md) for the storage UI layer and [env.md](docs/compounds/env.md), [scene.md](docs/compounds/scene.md), or [player.md](docs/compounds/player.md) for the relevant feature.
2. Storage endpoints require **signed fetch** (ADR-44). In the feature's `*.client.ts`, add endpoints with a `queryFn` that receives `wallet` and `isSignedIn`, calls `createQueryFetch(wallet, isSignedIn)`, and uses `wrapSignedFetch(signedFetch, url, init)` from `@/lib/fetch`. In the page or component, pass `wallet` and `isSignedIn` from `useAuth()` into every storage query and mutation. Use `skip: !wallet` on queries so they only run when the user can sign.
3. Add MSW handlers in `src/test/handlers/storage-api.handlers.ts`; in tests pass `wallet: undefined, isSignedIn: false` so `createAuthenticatedFetch` falls back to plain fetch and MSW can intercept.

## Environment

- Dev server: `npm run dev` (port 5173)
- Auth proxy: `/auth` → `https://decentraland.zone/auth`
- Config: `src/config/env/{dev,stg,prd}.json`

## PR Guidelines

- Branch naming: `feat/[feature]`, `fix/[issue]`, `chore/[task]`
- Commits must be GPG signed
- Follow PR template in `.github/pull_request_template.md`
- Include test coverage for new code

## Don't

- Don't use `@dcl/single-sign-on-client` v2.x
- Don't import internal feature files (use barrel exports)
- Don't skip tests
- Don't hardcode environment URLs (use config)
- Don't commit `.env` files
