import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { act, renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import { resetStorageApiStores } from '@/test/handlers'
import { useClearEnvMutation, useDeleteEnvMutation, useListEnvKeysQuery, useSetEnvMutation } from './env.client'
import type { EnvKey } from './env.types'

const authParams = { wallet: undefined, isSignedIn: false, realm: null, position: null }

const createWrapper = () => {
  const store = setupStore()
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return Wrapper
}

describe('env client', () => {
  beforeEach(() => {
    resetStorageApiStores()
  })

  describe('useListEnvKeysQuery', () => {
    describe('when fetching env keys', () => {
      it('should return list of keys', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useListEnvKeysQuery(authParams), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(2)
        expect(result.current.data?.map((k: EnvKey) => k.key)).toContain('API_KEY')
        expect(result.current.data?.map((k: EnvKey) => k.key)).toContain('DATABASE_URL')
      })
    })
  })

  describe('useSetEnvMutation', () => {
    describe('when setting an env value', () => {
      it('should call PUT endpoint successfully', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useSetEnvMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({ ...authParams, key: 'NEW_KEY', value: 'new-value' })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useDeleteEnvMutation', () => {
    describe('when deleting an env value', () => {
      it('should call DELETE endpoint successfully', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useDeleteEnvMutation(), { wrapper })

        await act(async () => {
          await result.current[0]({ ...authParams, key: 'API_KEY' })
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })

  describe('useClearEnvMutation', () => {
    describe('when clearing all env values', () => {
      it('should call DELETE /env with confirmation header', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useClearEnvMutation(), { wrapper })

        await act(async () => {
          await result.current[0](authParams)
        })

        await waitFor(() => expect(result.current[1].isSuccess).toBe(true))
      })
    })
  })
})
