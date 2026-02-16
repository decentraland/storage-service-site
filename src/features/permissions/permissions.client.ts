import { config } from '@/config'
import { client } from '@/services/client'
import type { ParcelOperators, WorldPermissions } from './permissions.types'

const permissionsClient = client.injectEndpoints({
  endpoints: build => ({
    getRealmPermissions: build.query<WorldPermissions, { realm: string }>({
      query: ({ realm }) => ({
        url: `${config.get('WORLDS_CONTENT_SERVER_URL')}/world/${realm}/permissions`,
        method: 'GET'
      }),
      providesTags: (_result, _error, { realm }) => [{ type: 'Permissions' as const, id: realm }]
    }),

    getParcelOperators: build.query<ParcelOperators, { x: number; y: number }>({
      query: ({ x, y }) => ({
        url: `${config.get('PEER_URL')}/lambdas/parcels/${x}/${y}/operators`,
        method: 'GET'
      }),
      providesTags: (_result, _error, { x, y }) => [{ type: 'Permissions' as const, id: `${x},${y}` }]
    })
  })
})

const { useGetRealmPermissionsQuery, useGetParcelOperatorsQuery } = permissionsClient

export { permissionsClient, useGetParcelOperatorsQuery, useGetRealmPermissionsQuery }
