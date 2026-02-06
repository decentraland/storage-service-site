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

  // GET /wallet/contribute (OpenAPI: worldsContentServer_getContributableDomains)
  http.get(`${baseUrl()}/wallet/contribute`, () => {
    return HttpResponse.json({
      domains: [
        {
          name: 'shared-world.dcl.eth',
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
