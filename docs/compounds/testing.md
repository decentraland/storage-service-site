# Testing

## Overview

Testing setup using Vitest, React Testing Library, and MSW (Mock Service Worker) following Decentraland testing standards.

## Stack

| Tool                   | Version | Purpose                 |
| ---------------------- | ------- | ----------------------- |
| Vitest                 | ^3.0.4  | Test runner             |
| @testing-library/react | ^16.2.0 | React component testing |
| @testing-library/dom   | ^10.4.0 | DOM queries             |
| MSW                    | ^2.7.0  | API mocking             |

## Configuration

### Vitest (vite.config.ts)

```typescript
test: {
  globals: true,                          // No need to import describe, it, expect
  environment: 'jsdom',                   // Browser-like environment
  setupFiles: ['./src/test/setup.ts'],    // Global setup
  include: ['src/**/*.test.{ts,tsx}'],    // Test file pattern
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  },
  server: {
    deps: {
      // Inline DCL packages for ESM compatibility
      inline: ['decentraland-ui2', '@dcl/hooks', '@dcl/ui-env', '@dcl/schemas']
    }
  }
}
```

### Global Setup (src/test/setup.ts)

- **React Testing Library**: `configure({ asyncUtilTimeout: 5000 })`.
- **Console suppression**: In `beforeAll`, `console.error` and `console.warn` are overridden to suppress known third-party patterns (e.g. act() warnings from decentraland-ui2, CSS pseudo-class warnings from emotion/MUI, CSS parsing errors from jsdom). Original methods are restored in `afterAll`.
- **MSW**: `beforeAll` → `server.listen({ onUnhandledRequest: 'warn' })`; `afterEach` → `server.resetHandlers()` and `cleanup()`; `afterAll` → `server.close()`.
- **window.matchMedia**: Mocked for MUI/decentraland-ui2 components at the end of setup.

### MSW Server (src/test/server.ts)

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### MSW Handlers (src/test/handlers/)

Handlers are composed in **index.ts**:

- **http.get('/health')**: Returns `{ status: 'ok' }`.
- **worldsContentServerHandlers** (`worlds-content-server.handlers.ts`): Worlds Content Server API — `GET /world/:realm/permissions`, `GET /wallet/contribute` (OpenAPI-aligned).
- **permissionsHandlers** (`permissions.handlers.ts`): Catalyst/peer — `GET {PEER_URL}/lambdas/parcels/:x/:y/operators`.
- **storageApiHandlers** (`storage-api.handlers.ts`): World Storage Service API (OpenAPI-aligned) — env (`/env`, `/env/:key`), world values (`/values`, `/values/:key`), players (`/players`, `/players/:address/values`, `/players/:address/values/:key`). In-memory stores; **resetStorageApiStores** is exported for tests that need a clean state.

Index exports **handlers** and **resetStorageApiStores**. Tests that need assets/subgraphs can use **server.use(...)** with `assets.handlers.ts` or `subgraphs.handlers.ts` (not in the default handler list).

## Test Utilities (src/test/utils.tsx)

Custom render function with all providers:

```typescript
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { setupStore, type RootState } from '@/app/store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
}

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = setupStore()
  return (
    <Provider store={store}>
      <DclThemeProvider theme={darkTheme}>
        <BrowserRouter>{children}</BrowserRouter>
      </DclThemeProvider>
    </Provider>
  )
}

const customRender = (ui: React.ReactElement, options?: ExtendedRenderOptions) => {
  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
```

## Decentraland Testing Standards

### Nested Describe Pattern

```typescript
let flag: string

describe('when the flag is red', () => {
  let wind: string
  let someObject: { id: string; swim: jest.Mock }

  beforeEach(() => {
    flag = 'red'
    someObject = { id: '1', swim: vi.fn() }
  })

  // Single expectation
  describe('and the wind is strong', () => {
    const aConstantPrimitiveValue = 'something'

    beforeEach(() => {
      wind = 'strong'
    })

    it('should not go swimming', () => {
      expect(goSwimming(flag, wind, someObject)).toBe(false)
    })
  })

  // Multiple expectations
  describe('and the wind is weak', () => {
    let result: boolean

    beforeEach(() => {
      wind = 'weak'
      result = goSwimming(flag, wind, someObject)
    })

    it('should go swimming', () => {
      expect(result).toBe(true)
    })

    it('should have called the swim method', () => {
      expect(someObject.swim).toHaveBeenCalled()
    })
  })
})
```

### Key Principles

1. **Context in describe blocks**: Use `when [condition]` and `and [sub-condition]`
2. **Setup in beforeEach**: Initialize state before each test
3. **Single responsibility**: Each `it` block tests one thing
4. **Descriptive names**: `it('should [expected behavior]')`

## Mocking Patterns

### Mocking Modules

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('@/lib/fetch', () => ({
  signedFetch: vi.fn()
}))

// Mock with hoisted variables (for complex mocks)
const { mockFn } = vi.hoisted(() => ({
  mockFn: vi.fn()
}))

vi.mock('some-module', () => ({
  default: mockFn
}))
```

### Mocking decentraland-connect

```typescript
vi.mock('decentraland-connect', () => ({
  connection: {
    tryPreviousConnection: vi.fn().mockResolvedValue({
      account: '0x1234...',
      chainId: 1
    }),
    disconnect: vi.fn(),
    getProvider: vi.fn()
  }
}))
```

### Mocking @dcl/single-sign-on-client

```typescript
vi.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: vi.fn().mockReturnValue({
    expiration: new Date(Date.now() + 86400000) // 24h from now
  }),
  localStorageClearIdentity: vi.fn(),
  getIdentity: vi.fn().mockResolvedValue({
    expiration: new Date(Date.now() + 86400000)
  })
}))
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific file
npm test -- src/features/auth/AuthProvider.test.tsx
```

## Common Issues

### ESM Import Errors

If you see `Directory import ... is not supported resolving ES modules`, add the package to `test.server.deps.inline` in `vite.config.ts`.

### MUI Theme Errors

If you see `Cannot read properties of undefined (reading 'down')`, ensure `window.matchMedia` is mocked in setup.ts.

### MSW Unhandled Requests

If external requests (like CMS) cause errors, use `onUnhandledRequest: 'warn'` instead of `'error'`.

### act() Warnings

Wrap state updates in `act()` or use `waitFor()`:

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```
