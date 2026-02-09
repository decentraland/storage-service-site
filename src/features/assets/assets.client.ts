import { config } from '@/config'
import { type WrapSignedFetchError, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import { getLandQuery, transformLandQueryResult } from './assets.utils'
import type { ContributableDomain, ContributableDomainsResponse, DCLNamesResponse, Land, LandQueryResponse } from './assets.types'

const LAND_MANAGER_SUBGRAPH = config.get('LAND_MANAGER_SUBGRAPH')
const MARKETPLACE_SUBGRAPH = config.get('MARKETPLACE_SUBGRAPH')

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

    getContributableDomains: build.query<
      ContributableDomain[],
      { address: string; signedFetch: (url: string, init?: RequestInit) => Promise<Response> }
    >({
      queryFn: async ({ signedFetch }) => {
        const url = `${config.get('WORLDS_CONTENT_SERVER_URL')}/wallet/contribute`
        try {
          const json = await wrapSignedFetch<ContributableDomainsResponse>(signedFetch, url)
          const data: ContributableDomain[] = json.domains.map(domain => ({
            name: domain.name,
            userPermissions: domain.user_permissions,
            size: domain.size,
            owner: domain.owner
          }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({ endpointName, address: queryArgs.address }),
      providesTags: ['ContributableDomains']
    })
  })
})

const { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery } = assetsClient

export { assetsClient, useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery }
