import { HttpResponse, http } from 'msw'
import { config } from '@/config'

const permissionsHandlers = [
  // World permissions endpoint
  http.get(`${config.get('WORLDS_CONTENT_SERVER_URL')}/world/:realm/permissions`, ({ params }) => {
    const { realm } = params

    // Mock different scenarios based on realm name
    if (realm === 'unauthorized.dcl.eth') {
      return HttpResponse.json({
        permissions: {
          deployment: { type: 'allow-list', wallets: ['0xother'] },
          streaming: { type: 'allow-list', wallets: [] },
          access: { type: 'unrestricted' }
        },
        owner: '0xother',
        summary: {}
      })
    }

    return HttpResponse.json({
      permissions: {
        deployment: { type: 'allow-list', wallets: ['0x123', '0x456'] },
        streaming: { type: 'allow-list', wallets: [] },
        access: { type: 'unrestricted' }
      },
      owner: '0xowner',
      summary: {}
    })
  }),

  // Parcel operators endpoint
  http.get(`${config.get('PEER_URL')}/lambdas/parcels/:x/:y/operators`, ({ params }) => {
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
