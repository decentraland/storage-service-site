import { config } from '@/config'
import { type WrapSignedFetchError, createQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import type { DeleteSceneValueParams, GetSceneValueParams, SceneKey, SceneValue, SetSceneValueParams } from './scene.types'

/** OpenAPI ListStorageItemsResponse */
interface ListStorageItemsResponse {
  data: Array<{ key: string; value: unknown }>
  pagination: { limit: number; offset: number; total: number }
}

/** OpenAPI StorageValueResponse */
interface StorageValueResponse {
  value: unknown
}

interface AuthParams {
  wallet?: string
  isSignedIn?: boolean
}

const baseUrl = () => config.get('STORAGE_API_URL')

const sceneClient = client.injectEndpoints({
  endpoints: build => ({
    listSceneKeys: build.query<SceneKey[], AuthParams>({
      queryFn: async ({ wallet, isSignedIn }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
        try {
          const response = await wrapSignedFetch<ListStorageItemsResponse>(signedFetch, `${baseUrl()}/values`)
          const data: SceneKey[] = response.data.map(({ key }) => ({ key }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName }) => ({ endpointName }),
      providesTags: ['Scene']
    }),

    getSceneValue: build.query<SceneValue, GetSceneValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, key }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(signedFetch, `${baseUrl()}/values/${encodeURIComponent(key)}`)
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      providesTags: (_result, _error, { key }) => [{ type: 'Scene', id: key }]
    }),

    setSceneValue: build.mutation<SceneValue, SetSceneValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, key, value }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(signedFetch, `${baseUrl()}/values/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value })
          })
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: ['Scene']
    }),

    deleteSceneValue: build.mutation<void, DeleteSceneValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, key }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
        try {
          const response = await signedFetch(`${baseUrl()}/values/${encodeURIComponent(key)}`, { method: 'DELETE' })
          if (!response.ok) {
            throw { status: response.status, data: await response.text().catch(() => undefined) }
          }
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: ['Scene']
    }),

    clearScene: build.mutation<void, AuthParams>({
      queryFn: async ({ wallet, isSignedIn }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
        try {
          const response = await signedFetch(`${baseUrl()}/values`, {
            method: 'DELETE',
            headers: {
              'X-Confirm-Delete-All': 'true'
            }
          })
          if (!response.ok) {
            throw { status: response.status, data: await response.text().catch(() => undefined) }
          }
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: ['Scene']
    })
  })
})

const { useClearSceneMutation, useDeleteSceneValueMutation, useGetSceneValueQuery, useListSceneKeysQuery, useSetSceneValueMutation } =
  sceneClient

export {
  sceneClient,
  useClearSceneMutation,
  useDeleteSceneValueMutation,
  useGetSceneValueQuery,
  useListSceneKeysQuery,
  useSetSceneValueMutation
}
