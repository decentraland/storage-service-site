import { config } from '@/config'
import { type WrapSignedFetchError, createQueryFetch, wrapSignedFetch } from '@/lib/fetch'
import { client } from '@/services/client'
import { getLandQuery, getRentalsQuery, transformLandQueryResult, transformRentalsQueryResult } from './assets.utils'
import type {
  ContributableDomain,
  ContributableDomainsResponse,
  DCLNamesResponse,
  Land,
  LandQueryResponse,
  Rental,
  RentalsQueryResponse
} from './assets.types'

const LAND_MANAGER_SUBGRAPH = config.get('LAND_MANAGER_SUBGRAPH')
const MARKETPLACE_SUBGRAPH = config.get('MARKETPLACE_SUBGRAPH')
const RENTALS_SUBGRAPH = config.get('RENTALS_SUBGRAPH')

const assetsClient = client.injectEndpoints({
  endpoints: build => ({
    getUserLands: build.query<Land[], { address: string; tenantTokenIds?: string[]; lessorTokenIds?: string[] }>({
      query: ({ address, tenantTokenIds, lessorTokenIds }) => ({
        url: LAND_MANAGER_SUBGRAPH,
        method: 'POST',
        body: {
          query: getLandQuery(),
          variables: {
            address: address.toLowerCase(),
            tenantTokenIds: tenantTokenIds ?? [],
            lessorTokenIds: lessorTokenIds ?? []
          }
        }
      }),
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        tenantTokenIds: [...(queryArgs.tenantTokenIds ?? [])].sort(),
        lessorTokenIds: [...(queryArgs.lessorTokenIds ?? [])].sort()
      }),
      transformResponse: (response: LandQueryResponse) => transformLandQueryResult(response.data),
      providesTags: ['UserLands']
    }),

    getUserRentals: build.query<{ lessorRentals: Rental[]; tenantRentals: Rental[] }, { address: string }>({
      query: ({ address }) => ({
        url: RENTALS_SUBGRAPH,
        method: 'POST',
        body: {
          query: getRentalsQuery(),
          variables: {
            address: address.toLowerCase()
          }
        }
      }),
      transformResponse: (response: RentalsQueryResponse) => transformRentalsQueryResult(response.data),
      providesTags: ['UserRentals']
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

    getContributableDomains: build.query<ContributableDomain[], { address: string; wallet?: string; isSignedIn?: boolean }>({
      queryFn: async ({ wallet, isSignedIn }) => {
        const signedFetch = createQueryFetch(wallet, isSignedIn)
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

const { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery, useGetUserRentalsQuery } = assetsClient

export { assetsClient, useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery, useGetUserRentalsQuery }
