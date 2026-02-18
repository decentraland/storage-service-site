/**
 * MSW handlers for Decentraland peer profiles endpoint.
 */
import { HttpResponse, http } from 'msw'
import { config } from '@/config'

const peerUrl = () => config.get('PEER_URL')

const mockProfiles: Record<string, { avatars: Array<Record<string, unknown>> }> = {
  '0xplayer1': {
    avatars: [
      {
        ethAddress: '0xplayer1',
        name: 'TestPlayer',
        hasClaimedName: true,
        avatar: {
          snapshots: {
            face256: 'https://peer.decentraland.zone/content/face256_0xplayer1'
          }
        }
      }
    ]
  },
  '0xplayer2': {
    avatars: [
      {
        ethAddress: '0xplayer2',
        name: 'Guest',
        hasClaimedName: false,
        avatar: {
          snapshots: {
            face256: 'https://peer.decentraland.zone/content/face256_0xplayer2'
          }
        }
      }
    ]
  }
}

const profilesHandlers = [
  http.post(`${peerUrl()}/lambdas/profiles`, async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }
    const results = body.ids.map(id => {
      const profile = mockProfiles[id.toLowerCase()]
      return profile ?? { avatars: [] }
    })
    return HttpResponse.json(results)
  })
]

export { profilesHandlers }
