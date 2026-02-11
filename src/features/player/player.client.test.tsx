import { Provider } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import { resetStorageApiStores } from '@/test/handlers'
import {
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useSetPlayerValueMutation
} from './player.client'
import type { PlayerKey } from './player.types'

const authParams = { wallet: undefined, isSignedIn: false }

describe('player client', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('useListPlayerKeysQuery', () => {
    describe('when fetching player keys', () => {
      it('should return list of keys for player', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useListPlayerKeysQuery({ ...authParams, address: '0xplayer1' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const keys = result.current.data?.map((k: PlayerKey) => k.key)
        expect(keys).toContain('inventory')
        expect(keys).toContain('progress')
      })
    })

    describe('when player does not exist', () => {
      it('should return empty array', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useListPlayerKeysQuery({ ...authParams, address: '0xnonexistent' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toEqual([])
      })
    })
  })

  describe('useGetPlayerValueQuery', () => {
    describe('when fetching player value', () => {
      it('should return the value', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(
          () =>
            useGetPlayerValueQuery({
              ...authParams,
              address: '0xplayer1',
              key: 'inventory'
            }),
          { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.value).toEqual({ sword: 1, shield: 2 })
      })
    })

    describe('when key does not exist', () => {
      it('should return 404 error', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(
          () =>
            useGetPlayerValueQuery({
              ...authParams,
              address: '0xplayer1',
              key: 'nonexistent'
            }),
          { wrapper }
        )

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(result.current.error).toMatchObject({ status: 404 })
      })
    })
  })

  describe('useSetPlayerValueMutation', () => {
    describe('when setting a player value', () => {
      it('should call PUT endpoint', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useSetPlayerValueMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({
            ...authParams,
            address: '0xplayer1',
            key: 'newKey',
            value: { test: true }
          })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useDeletePlayerValueMutation', () => {
    describe('when deleting a player value', () => {
      it('should call DELETE endpoint', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useDeletePlayerValueMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({
            ...authParams,
            address: '0xplayer1',
            key: 'inventory'
          })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useClearPlayerMutation', () => {
    describe('when clearing all player values', () => {
      it('should call DELETE /players/:address/values with confirmation header', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useClearPlayerMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({ ...authParams, address: '0xplayer1' })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useClearAllPlayersMutation', () => {
    describe('when clearing all players', () => {
      it('should call DELETE /players with confirmation header', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useClearAllPlayersMutation(), { wrapper })

        await act(async () => {
          await result.current[0](authParams)
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })
})
