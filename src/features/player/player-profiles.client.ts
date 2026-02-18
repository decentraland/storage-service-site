import type { Avatar } from '@dcl/schemas'
import { config } from '@/config'
import { client } from '@/services/client'
import { profilesUpsertMany } from './player-profiles.slice'
import { getDisplayName } from './player.utils'
import type { PlayerProfile } from './player.types'

interface ProfilesResponse {
  avatars: Avatar[]
}

interface GetProfilesParams {
  ids: string[]
}

/** Parse raw profile responses into PlayerProfile objects for the normalized cache */
const parseProfiles = (responses: ProfilesResponse[]): PlayerProfile[] => {
  const profiles: PlayerProfile[] = []
  for (const entry of responses) {
    const avatar = entry.avatars?.[0]
    if (!avatar?.ethAddress) {
      continue
    }
    const address = avatar.ethAddress.toLowerCase()
    profiles.push({
      address,
      displayName: getDisplayName(avatar, address),
      avatarUrl: avatar.avatar?.snapshots?.face256,
      hasClaimedName: avatar.hasClaimedName ?? false,
      avatar
    })
  }
  return profiles
}

const profilesClient = client.injectEndpoints({
  endpoints: build => ({
    getProfiles: build.query<ProfilesResponse[], GetProfilesParams>({
      query: ({ ids }) => ({
        url: `${config.get('PEER_URL')}/lambdas/profiles`,
        method: 'POST',
        body: { ids }
      }),
      serializeQueryArgs: ({ queryArgs }) => ({
        ids: [...queryArgs.ids].sort((a, b) => a.localeCompare(b))
      }),
      keepUnusedDataFor: 300,
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const profiles = parseProfiles(data)
          if (profiles.length > 0) {
            dispatch(profilesUpsertMany(profiles))
          }
        } catch {
          // Query failed -- nothing to cache
        }
      }
    })
  })
})

const { useGetProfilesQuery } = profilesClient

export { profilesClient, useGetProfilesQuery }
export type { GetProfilesParams, ProfilesResponse }
