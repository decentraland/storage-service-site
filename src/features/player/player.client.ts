import { config } from '@/config'
import { type WrapSignedFetchError, createScopedQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { type AuthParams, type StorageContext, client, storageContextId } from '@/services/client'
import type {
  ClearPlayerParams,
  DeletePlayerValueParams,
  GetPlayerValueParams,
  ListPlayerKeysParams,
  ListPlayersResponse,
  ListStorageItemsResponse,
  PlayerKey,
  PlayerValue,
  SetPlayerValueParams,
  StorageValueResponse
} from './player.types'

const baseUrl = () => config.get('STORAGE_API_URL')

const playerClient = client.injectEndpoints({
  endpoints: build => ({
    listPlayers: build.query<string[], AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<ListPlayersResponse>(signedFetch, `${baseUrl()}/players`)
          return { data: response.data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { realm, position }) => [{ type: 'Player', id: storageContextId(realm, position) }]
    }),

    listPlayerKeys: build.query<PlayerKey[], ListPlayerKeysParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, address, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<ListStorageItemsResponse>(
            signedFetch,
            `${baseUrl()}/players/${encodeURIComponent(address)}/values`
          )
          const data: PlayerKey[] = response.data.map(({ key }) => ({ key }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (result, _error, { address, realm, position }) => [
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}` },
        ...(result?.map(({ key }) => ({ type: 'PlayerKeys' as const, id: `${storageContextId(realm, position)}-${address}-${key}` })) ?? [])
      ]
    }),

    getPlayerValue: build.query<PlayerValue, GetPlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, address, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${baseUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        key: queryArgs.key,
        storageContext: storageContextId(queryArgs.realm, queryArgs.position)
      }),
      providesTags: (_result, _error, { address, key, realm, position }) => [
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}-${key}` }
      ]
    }),

    setPlayerValue: build.mutation<PlayerValue, SetPlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, address, key, value, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${baseUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value })
            }
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { address, key, realm, position }) => [
        { type: 'Player', id: storageContextId(realm, position) },
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}-${key}` },
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}` }
      ]
    }),

    deletePlayerValue: build.mutation<void, DeletePlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, address, key, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`, {
            method: 'DELETE'
          })
          if (!response.ok) {
            throw { status: response.status, data: await response.text().catch(() => undefined) }
          }
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { address, key, realm, position }) => [
        { type: 'Player', id: storageContextId(realm, position) },
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}-${key}` },
        { type: 'PlayerKeys', id: `${storageContextId(realm, position)}-${address}` }
      ]
    }),

    clearPlayer: build.mutation<void, ClearPlayerParams & AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, address, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/players/${encodeURIComponent(address)}/values`, {
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Player', id: storageContextId(realm, position) }, 'PlayerKeys']
    }),

    clearAllPlayers: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ wallet, isSignedIn, realm, position }) => {
        const signedFetch = createScopedQueryFetch(wallet, isSignedIn, realm, position)
        try {
          const response = await signedFetch(`${baseUrl()}/players`, {
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
      invalidatesTags: (_result, _error, { realm, position }) => [{ type: 'Player', id: storageContextId(realm, position) }, 'PlayerKeys']
    })
  })
})

const {
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useSetPlayerValueMutation
} = playerClient

export {
  playerClient,
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useSetPlayerValueMutation
}
