import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { server } from './server'

// Configure React Testing Library
configure({
  asyncUtilTimeout: 5000
})

// Warn if any test takes longer than 5 seconds
beforeEach(() => {
  const start = Date.now()
  return () => {
    const duration = Date.now() - start
    if (duration > 5000) {
      console.warn(`⚠️  Test took ${duration}ms - consider optimizing`)
    }
  }
})

// Store original console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Patterns to suppress from third-party libraries
const suppressPatterns = [
  // act() warnings from decentraland-ui2 components (DownloadButton, etc.)
  'An update to null inside a test was not wrapped in act',
  'An update to %s inside a test was not wrapped in act',
  // CSS pseudo-class warnings from emotion/MUI
  'potentially unsafe when doing server-side rendering',
  // CSS parsing errors from jsdom (doesn't support all CSS features)
  'Could not parse CSS stylesheet'
]

const shouldSuppressMessage = (args: unknown[]): boolean => {
  const message = args[0]
  if (typeof message !== 'string') return false
  return suppressPatterns.some(pattern => message.includes(pattern))
}

// Override console methods before all tests
beforeAll(() => {
  console.error = vi.fn((...args: unknown[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleError.apply(console, args)
    }
  })

  console.warn = vi.fn((...args: unknown[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleWarn.apply(console, args)
    }
  })

  server.listen({ onUnhandledRequest: 'warn' })
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  server.close()
})

// Mock window.matchMedia for MUI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
