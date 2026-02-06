import { Provider } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import {
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useSetPlayerValueMutation
} from './player.client'
import type { PlayerAddress, PlayerKey } from './player.types'

describe('player client', () => {
  describe('useListPlayersQuery', () => {
    describe('when fetching players', () => {
      it('should return list of player addresses', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useListPlayersQuery(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const addresses = result.current.data?.map((p: PlayerAddress) => p.address)
        expect(addresses).toContain('0xplayer1')
        expect(addresses).toContain('0xplayer2')
      })
    })
  })

  describe('useListPlayerKeysQuery', () => {
    describe('when fetching player keys', () => {
      it('should return list of keys for player', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useListPlayerKeysQuery({ address: '0xplayer1' }), { wrapper })

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

        const { result } = renderHook(() => useListPlayerKeysQuery({ address: '0xnonexistent' }), { wrapper })

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

        const { result } = renderHook(() => useGetPlayerValueQuery({ address: '0xplayer1', key: 'inventory' }), {
          wrapper
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.value).toEqual({ sword: 1, shield: 2 })
      })
    })

    describe('when key does not exist', () => {
      it('should return 404 error', async () => {
        const store = setupStore()
        const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>

        const { result } = renderHook(() => useGetPlayerValueQuery({ address: '0xplayer1', key: 'nonexistent' }), {
          wrapper
        })

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
          await result.current[0]({ address: '0xplayer1', key: 'newKey', value: { test: true } })
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
          await result.current[0]({ address: '0xplayer1', key: 'inventory' })
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
          await result.current[0]({ address: '0xplayer1' })
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
          await result.current[0]()
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })
})
