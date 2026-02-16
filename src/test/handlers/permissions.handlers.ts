/**
 * MSW handlers for catalyst/peer (parcel operators).
 * World permissions and wallet/contribute live in worlds-content-server.handlers.
 */
import { HttpResponse, http } from 'msw'
import { config } from '@/config'

const baseUrl = () => config.get('PEER_URL')

const permissionsHandlers = [
  // Catalyst/peer: GET /lambdas/parcels/{x}/{y}/operators
  http.get(`${baseUrl()}/lambdas/parcels/:x/:y/operators`, ({ params }) => {
    const { x, y } = params

    // Mock unauthorized parcel
    if (x === '999' && y === '999') {
      return HttpResponse.json({
        owner: '0xother',
        operator: null,
        updateOperator: null,
        updateManagers: [],
        approvedForAll: []
      })
    }

    return HttpResponse.json({
      owner: '0xowner',
      operator: null,
      updateOperator: '0x789',
      updateManagers: [],
      approvedForAll: ['0xapproved']
    })
  })
]

export { permissionsHandlers }
