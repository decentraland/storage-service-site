import { describe, expect, it } from 'vitest'
import { setupStore } from './store'

describe('store', () => {
  describe('when creating the store', () => {
    it('should create a store with client reducer', () => {
      const store = setupStore()

      expect(store.getState()).toHaveProperty('client')
    })
  })

  describe('when creating the store with preloaded state', () => {
    it('should include the preloaded state', () => {
      const preloadedState = {}
      const store = setupStore(preloadedState)

      expect(store.getState()).toBeDefined()
    })
  })
})
