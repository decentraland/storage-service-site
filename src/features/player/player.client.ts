import { config } from '@/config'
import { client } from '@/services/client'
import type {
  ClearPlayerParams,
  DeletePlayerValueParams,
  GetPlayerValueParams,
  ListPlayerKeysParams,
  PlayerAddress,
  PlayerKey,
  PlayerValue,
  SetPlayerValueParams
} from './player.types'

const playerClient = client.injectEndpoints({
  endpoints: build => ({
    listPlayers: build.query<PlayerAddress[], void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/players`,
        method: 'GET'
      }),
      providesTags: ['Player']
    }),

    listPlayerKeys: build.query<PlayerKey[], ListPlayerKeysParams>({
      query: ({ address }) => ({
        url: `${config.get('STORAGE_API_URL')}/players/${address}/values`,
        method: 'GET'
      }),
      providesTags: (_result, _error, { address }) => [{ type: 'PlayerKeys', id: address }]
    }),

    getPlayerValue: build.query<PlayerValue, GetPlayerValueParams>({
      query: ({ address, key }) => ({
        url: `${config.get('STORAGE_API_URL')}/players/${address}/values/${key}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, { address, key }) => [{ type: 'PlayerKeys', id: `${address}-${key}` }]
    }),

    setPlayerValue: build.mutation<PlayerValue, SetPlayerValueParams>({
      query: ({ address, key, value }) => ({
        url: `${config.get('STORAGE_API_URL')}/players/${address}/values/${key}`,
        method: 'PUT',
        body: { value }
      }),
      invalidatesTags: (_result, _error, { address }) => ['Player', { type: 'PlayerKeys', id: address }]
    }),

    deletePlayerValue: build.mutation<void, DeletePlayerValueParams>({
      query: ({ address, key }) => ({
        url: `${config.get('STORAGE_API_URL')}/players/${address}/values/${key}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, { address }) => ['Player', { type: 'PlayerKeys', id: address }]
    }),

    clearPlayer: build.mutation<void, ClearPlayerParams>({
      query: ({ address }) => ({
        url: `${config.get('STORAGE_API_URL')}/players/${address}/values`,
        method: 'DELETE',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'X-Confirm-Delete-All': 'true'
        }
      }),
      invalidatesTags: ['Player', 'PlayerKeys']
    }),

    clearAllPlayers: build.mutation<void, void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/players`,
        method: 'DELETE',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'X-Confirm-Delete-All': 'true'
        }
      }),
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
