/**
 * MSW handlers for Decentraland subgraphs (GraphQL POST).
 * - Land Manager: parcels/estates (see creator-hub land.ts)
 * - Marketplace: DCL names / ENS (see creator-hub ens.ts)
 */
import { HttpResponse, http } from 'msw'

const LAND_MANAGER_SUBGRAPH = 'https://subgraph.decentraland.org/decentraland/land-manager'
const MARKETPLACE_SUBGRAPH = 'https://subgraph.decentraland.org/decentraland/marketplace'

const subgraphsHandlers = [
  // Land Manager Subgraph (POST with GraphQL query – GetLands / parcels, estates)
  http.post(LAND_MANAGER_SUBGRAPH, async () => {
    return HttpResponse.json({
      data: {
        ownerParcels: [
          {
            x: '10',
            y: '20',
            tokenId: '123',
            owner: { address: '0xuser' },
            updateOperator: null,
            data: { name: 'My Parcel', description: null }
          }
        ],
        ownerEstates: [
          {
            id: '1',
            tokenId: '789',
            owner: { address: '0xuser' },
            updateOperator: null,
            size: 2,
            parcels: [
              { x: '5', y: '6', id: 'p1' },
              { x: '5', y: '7', id: 'p2' }
            ],
            data: { name: 'My Estate', description: 'A two-parcel estate' }
          }
        ],
        updateOperatorParcels: [
          {
            x: '30',
            y: '40',
            tokenId: '456',
            owner: { address: '0xother' },
            updateOperator: '0xuser',
            data: { name: 'Operated Parcel', description: null }
          }
        ],
        updateOperatorEstates: [],
        tenantParcels: [],
        tenantEstates: [],
        lessorParcels: [],
        lessorEstates: [],
        ownerAuthorizations: [],
        operatorAuthorizations: []
      }
    })
  }),

  // Marketplace Subgraph – DCL names (nfts where category: ens, ens.subdomain)
  http.post(MARKETPLACE_SUBGRAPH, async () => {
    return HttpResponse.json({
      data: {
        nfts: [{ ens: { subdomain: 'myworld' } }, { ens: { subdomain: 'testscene' } }]
      }
    })
  })
]

export { LAND_MANAGER_SUBGRAPH, MARKETPLACE_SUBGRAPH, subgraphsHandlers }
