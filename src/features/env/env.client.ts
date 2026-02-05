import { config } from '@/config'
import { client } from '@/services/client'
import type { DeleteEnvParams, EnvKey, SetEnvParams } from './env.types'

const envClient = client.injectEndpoints({
  endpoints: build => ({
    listEnvKeys: build.query<EnvKey[], void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/env`,
        method: 'GET'
      }),
      providesTags: ['Env']
    }),

    setEnv: build.mutation<void, SetEnvParams>({
      query: ({ key, value }) => ({
        url: `${config.get('STORAGE_API_URL')}/env/${key}`,
        method: 'PUT',
        body: { value }
      }),
      invalidatesTags: ['Env']
    }),

    deleteEnv: build.mutation<void, DeleteEnvParams>({
      query: ({ key }) => ({
        url: `${config.get('STORAGE_API_URL')}/env/${key}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Env']
    }),

    clearEnv: build.mutation<void, void>({
      query: () => ({
        url: `${config.get('STORAGE_API_URL')}/env`,
        method: 'DELETE',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'X-Confirm-Delete-All': 'true'
        }
      }),
      invalidatesTags: ['Env']
    })
  })
})

const { useListEnvKeysQuery, useSetEnvMutation, useDeleteEnvMutation, useClearEnvMutation } = envClient

export { envClient, useClearEnvMutation, useDeleteEnvMutation, useListEnvKeysQuery, useSetEnvMutation }
