import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import { resetStorageApiStores } from '@/test/handlers'
import {
  useClearSceneMutation,
  useDeleteSceneValueMutation,
  useGetSceneValueQuery,
  useListSceneKeysQuery,
  useSetSceneValueMutation
} from './scene.client'
import type { SceneKey, SceneValue } from './scene.types'

const authParams = { wallet: undefined, isSignedIn: false }

const createWrapper = () => {
  const store = setupStore()
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return Wrapper
}

describe('scene client', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('useListSceneKeysQuery', () => {
    describe('when fetching scene keys', () => {
      it('should return list of keys', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useListSceneKeysQuery(authParams), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(2)
        expect(result.current.data?.map((k: SceneKey) => k.key)).toContain('leaderboard')
        expect(result.current.data?.map((k: SceneKey) => k.key)).toContain('gameState')
      })
    })
  })

  describe('useGetSceneValueQuery', () => {
    describe('when fetching a scene value', () => {
      it('should return the value for the key', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetSceneValueQuery({ ...authParams, key: 'leaderboard' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const data = result.current.data as SceneValue
        expect(data.key).toBe('leaderboard')
        expect(data.value).toEqual({ scores: [100, 200, 300] })
      })
    })

    describe('when the key does not exist', () => {
      it('should return error', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetSceneValueQuery({ ...authParams, key: 'nonexistent' }), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))
      })
    })
  })

  describe('useSetSceneValueMutation', () => {
    describe('when setting a scene value', () => {
      it('should call PUT endpoint successfully', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useSetSceneValueMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({ ...authParams, key: 'newKey', value: { data: 'test' } })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useDeleteSceneValueMutation', () => {
    describe('when deleting a scene value', () => {
      it('should call DELETE endpoint successfully', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useDeleteSceneValueMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({ ...authParams, key: 'leaderboard' })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useClearSceneMutation', () => {
    describe('when clearing all scene values', () => {
      it('should call DELETE /values with confirmation header', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useClearSceneMutation(), { wrapper })

        await act(async () => {
          await result.current[0](authParams)
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })
})
