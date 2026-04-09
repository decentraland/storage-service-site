/**
 * MSW handlers for Decentraland Worlds Content Server API (OpenAPI-aligned).
 * Covers endpoints from https://github.com/decentraland/worlds-content-server/blob/main/docs/openapi.yaml
 * that this app uses: world permissions and wallet/contribute.
 */
import { HttpResponse, http } from 'msw'
import { config } from '@/config'

const baseUrl = () => config.get('WORLDS_CONTENT_SERVER_URL')

const worldsContentServerHandlers = [
  // GET /world/{world_name}/permissions (OpenAPI: worldsContentServer_getPermissions)
  http.get(`${baseUrl()}/world/:realm/permissions`, ({ params }) => {
    const { realm } = params
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

  // GET /world/{world_name}/scenes (OpenAPI: worldsContentServer_getScenes)
  http.get(`${baseUrl()}/world/:worldName/scenes`, ({ params }) => {
    const { worldName } = params
    if (worldName === 'myworld.dcl.eth') {
      return HttpResponse.json({
        scenes: [
          {
            entity: {
              metadata: {
                display: { title: 'Scene Beta' },
                scene: { parcels: ['1,0'], base: '1,0' }
              },
              pointers: ['1,0']
            },
            parcels: ['1,0']
          },
          {
            entity: {
              metadata: {
                display: { title: 'Scene Alpha' },
                scene: { parcels: ['0,0', '0,1'], base: '0,0' }
              },
              pointers: ['0,0']
            },
            parcels: ['0,0', '0,1']
          }
        ],
        total: 2
      })
    }
    return HttpResponse.json({
      scenes: [
        {
          entity: {
            metadata: {
              display: { title: 'Default Scene' },
              scene: { parcels: ['0,0'], base: '0,0' }
            },
            pointers: ['0,0']
          },
          parcels: ['0,0']
        }
      ],
      total: 1
    })
  }),

  // GET /wallet/contribute (OpenAPI: worldsContentServer_getContributableDomains)
  http.get(`${baseUrl()}/wallet/contribute`, () => {
    return HttpResponse.json({
      domains: [
        {
          name: 'shared-world.dcl.eth',
          user_permissions: ['deployment'],
          size: '100MB',
          owner: '0xowner'
        }
      ],
      count: 1
    })
  })
]

export { worldsContentServerHandlers }
