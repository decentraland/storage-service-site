import { config } from '@/config'
import { client } from '@/services/client'
import { getLandQuery, transformLandQueryResult } from './assets.utils'
import type { ContributableDomain, ContributableDomainsResponse, DCLNamesResponse, Land, LandQueryResponse } from './assets.types'

const LAND_MANAGER_SUBGRAPH = 'https://subgraph.decentraland.org/decentraland/land-manager'
const MARKETPLACE_SUBGRAPH = 'https://subgraph.decentraland.org/decentraland/marketplace'

const assetsClient = client.injectEndpoints({
  endpoints: build => ({
    getUserLands: build.query<Land[], { address: string }>({
      query: ({ address }) => ({
        url: LAND_MANAGER_SUBGRAPH,
        method: 'POST',
        body: {
          query: getLandQuery(),
          variables: {
            address: address.toLowerCase(),
            tenantTokenIds: [],
            lessorTokenIds: []
          }
        }
      }),
      transformResponse: (response: LandQueryResponse) => transformLandQueryResult(response.data),
      providesTags: ['UserLands']
    }),

    getUserDCLNames: build.query<string[], { address: string }>({
      query: ({ address }) => ({
        url: MARKETPLACE_SUBGRAPH,
        method: 'POST',
        body: {
          query: `{
            nfts(
              first: 1000,
              where: {
                owner_: { id: "${address.toLowerCase()}" },
                category: ens
              }
            ) {
              ens { subdomain }
            }
          }`
        }
      }),
      transformResponse: (response: DCLNamesResponse) => response.data.nfts.map(nft => `${nft.ens.subdomain}.dcl.eth`),
      providesTags: ['UserDCLNames']
    }),

    getContributableDomains: build.query<ContributableDomain[], { address: string }>({
      query: () => ({
        url: `${config.get('WORLDS_CONTENT_SERVER_URL')}/wallet/contribute`,
        method: 'GET'
      }),
      transformResponse: (response: ContributableDomainsResponse) =>
        response.domains.map(domain => ({
          name: domain.name,
          userPermissions: domain.user_permissions,
          size: domain.size,
          owner: domain.owner
        })),
      providesTags: ['ContributableDomains']
    })
  })
})

const { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery } = assetsClient

export { assetsClient, useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery }
