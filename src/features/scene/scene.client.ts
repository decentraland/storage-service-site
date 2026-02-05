import { config } from '@/config'
import { client } from '@/services/client'
import type { DeleteSceneValueParams, GetSceneValueParams, SceneKey, SceneValue, SetSceneValueParams } from './scene.types'

const sceneClient = client.injectEndpoints({
  endpoints: build => ({
    listSceneKeys: build.query<SceneKey[], void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/values`,
        method: 'GET'
      }),
      providesTags: ['Scene']
    }),

    getSceneValue: build.query<SceneValue, GetSceneValueParams>({
      query: ({ key }) => ({
        url: `${config.get('STORAGE_API_URL')}/values/${key}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, { key }) => [{ type: 'Scene', id: key }]
    }),

    setSceneValue: build.mutation<SceneValue, SetSceneValueParams>({
      query: ({ key, value }) => ({
        url: `${config.get('STORAGE_API_URL')}/values/${key}`,
        method: 'PUT',
        body: { value }
      }),
      invalidatesTags: ['Scene']
    }),

    deleteSceneValue: build.mutation<void, DeleteSceneValueParams>({
      query: ({ key }) => ({
        url: `${config.get('STORAGE_API_URL')}/values/${key}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Scene']
    }),

    clearScene: build.mutation<void, void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/values`,
        method: 'DELETE',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'X-Confirm-Delete-All': 'true'
        }
      }),
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
