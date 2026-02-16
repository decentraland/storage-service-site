import { config } from '@/config'
import { type WrapSignedFetchError, createQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import type {
  ClearPlayerParams,
  DeletePlayerValueParams,
  GetPlayerValueParams,
  ListPlayerKeysParams,
  ListStorageItemsResponse,
  PlayerKey,
  PlayerValue,
  SetPlayerValueParams,
  StorageValueResponse
} from './player.types'

interface AuthParams {
  wallet?: string
  isSignedIn?: boolean
}

const baseUrl = () => config.get('STORAGE_API_URL')

const playerClient = client.injectEndpoints({
  endpoints: build => ({
    listPlayerKeys: build.query<PlayerKey[], ListPlayerKeysParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, address }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({ endpointName, address: queryArgs.address }),
      providesTags: (result, _error, { address }) => [
        { type: 'PlayerKeys', id: address },
        ...(result?.map(({ key }) => ({ type: 'PlayerKeys' as const, id: `${address}-${key}` })) ?? []) // Individual key tags
      ]
    }),

    getPlayerValue: build.query<PlayerValue, GetPlayerValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, address, key }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      providesTags: (_result, _error, { address, key }) => [{ type: 'PlayerKeys', id: `${address}-${key}` }]
    }),

    setPlayerValue: build.mutation<PlayerValue, SetPlayerValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, address, key, value }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      invalidatesTags: (_result, _error, { address, key }) => [
        'Player',
        { type: 'PlayerKeys', id: `${address}-${key}` },
        { type: 'PlayerKeys', id: address }
      ]
    }),

    deletePlayerValue: build.mutation<void, DeletePlayerValueParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, address, key }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      invalidatesTags: (_result, _error, { address, key }) => [
        'Player',
        { type: 'PlayerKeys', id: `${address}-${key}` },
        { type: 'PlayerKeys', id: address }
      ]
    }),

    clearPlayer: build.mutation<void, ClearPlayerParams & AuthParams>({
      queryFn: async ({ wallet, isSignedIn, address }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      invalidatesTags: ['Player', 'PlayerKeys']
    }),

    clearAllPlayers: build.mutation<void, AuthParams>({
      queryFn: async ({ wallet, isSignedIn }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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
      invalidatesTags: ['Player', 'PlayerKeys']
    })
  })
})

const {
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useSetPlayerValueMutation
} = playerClient

export {
  playerClient,
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useSetPlayerValueMutation
}
