import { config } from '@/config'
import { type WrapSignedFetchError, createScopedQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import type { DeleteSceneValueParams, GetSceneValueParams, SceneKey, SceneValue, SetSceneValueParams } from './scene.types'

interface ListStorageItemsResponse {
  data: Array<{ key: string; value: unknown }>
  pagination: { limit: number; offset: number; total: number }
}

interface StorageValueResponse {
  value: unknown
}

interface AuthParams {
  wallet?: string
  isSignedIn?: boolean
}

interface StorageContext {
  realm?: string | null
  position?: string | null
}

const storageContextId = (realm?: string | null, position?: string | null): string => realm ?? position ?? ''

const baseUrl = () => config.get('STORAGE_API_URL')

const sceneClient = client.injectEndpoints({
  endpoints: build => ({
    listSceneKeys: build.query<SceneKey[], AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<ListStorageItemsResponse>(signedFetch, `${baseUrl()}/values`)
          const data: SceneKey[] = response.data.map(({ key }) => ({ key }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { realm, position }) => [{ type: 'Scene', id: storageContextId(realm, position) }]
    }),

    getSceneValue: build.query<SceneValue, GetSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(signedFetch, `${baseUrl()}/values/${encodeURIComponent(key)}`)
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        key: queryArgs.key,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { key, realm, position }) => [
        { type: 'Scene', id: storageContextId(realm, position) },
        { type: 'Scene', id: `${storageContextId(realm, position)}-${key}` }
      ]
    }),

    setSceneValue: build.mutation<SceneValue, SetSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, value, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Scene', id: storageContextId(realm, position) }]
    }),

    deleteSceneValue: build.mutation<void, DeleteSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Scene', id: storageContextId(realm, position) }]
    }),

    clearScene: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Scene', id: storageContextId(realm, position) }]
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
