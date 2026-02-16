import { config } from '@/config'
import { type WrapSignedFetchError, createScopedQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import type { DeleteEnvParams, EnvKey, EnvValue, GetEnvValueParams, SetEnvParams } from './env.types'

/** OpenAPI ListEnvKeysResponse */
interface ListEnvKeysResponse {
  data: string[]
  pagination: { limit: number; offset: number; total: number }
}

interface AuthParams {
  wallet?: string
  isSignedIn?: boolean
}

/** Optional realm/position for cache key — storage is scoped per world/parcel */
interface StorageContext {
  realm?: string | null
  position?: string | null
}

const storageContextId = (realm?: string | null, position?: string | null): string => realm ?? position ?? ''

const baseUrl = () => config.get('STORAGE_API_URL')

const envClient = client.injectEndpoints({
  endpoints: build => ({
    listEnvKeys: build.query<EnvKey[], AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<ListEnvKeysResponse>(signedFetch, `${baseUrl()}/env`)
          const data: EnvKey[] = response.data.map(key => ({ key }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { realm, position }) => [{ type: 'Env', id: storageContextId(realm, position) }]
    }),

    getEnvValue: build.query<EnvValue, GetEnvValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<{ value: string }>(signedFetch, `${baseUrl()}/env/${encodeURIComponent(key)}`)
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        key: queryArgs.key,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { key, realm, position }) => [{ type: 'Env', id: `${storageContextId(realm, position)}:${key}` }]
    }),

    setEnv: build.mutation<void, SetEnvParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, value, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/env/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
          })
          if (!response.ok) {
            throw { status: response.status, data: await response.text().catch(() => undefined) }
          }
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Env', id: storageContextId(realm, position) }]
    }),

    deleteEnv: build.mutation<void, DeleteEnvParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/env/${encodeURIComponent(key)}`, { method: 'DELETE' })
          if (!response.ok) {
            throw { status: response.status, data: await response.text().catch(() => undefined) }
          }
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Env', id: storageContextId(realm, position) }]
    }),

    clearEnv: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/env`, {
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Env', id: storageContextId(realm, position) }]
    })
  })
})

const { useClearEnvMutation, useDeleteEnvMutation, useGetEnvValueQuery, useListEnvKeysQuery, useSetEnvMutation } = envClient

export { envClient, useClearEnvMutation, useDeleteEnvMutation, useGetEnvValueQuery, useListEnvKeysQuery, useSetEnvMutation }
