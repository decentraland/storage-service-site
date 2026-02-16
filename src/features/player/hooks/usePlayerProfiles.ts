import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { useGetProfilesQuery } from '../player-profiles.client'
import type { PlayerProfile } from '../player.types'

interface UsePlayerProfilesResult {
  profilesMap: Map<string, PlayerProfile>
  isLoading: boolean
}

/** Select the stable entities record -- reference only changes on actual upserts */
const selectProfileEntities = (state: RootState) => state.profiles.entities

/**
 * Fetches profiles for a batch of addresses.
 * Reads from the normalized Redux slice first; only fetches missing addresses from the API.
 * After the API response arrives, `onQueryStarted` in the client upserts into the slice,
 * so subsequent lookups (e.g. detail view) hit the cache without a new request.
 */
const usePlayerProfiles = (addresses: string[]): UsePlayerProfilesResult => {
  const normalizedAddresses = useMemo(() => addresses.map(a => a.toLowerCase()), [addresses])

  const entities = useSelector(selectProfileEntities)

  const { cachedProfiles, missingAddresses } = useMemo(() => {
    const cached: PlayerProfile[] = []
    const missing: string[] = []
    for (const addr of normalizedAddresses) {
      const profile = entities[addr]
      if (profile) {
        cached.push(profile)
      } else {
        missing.push(addr)
      }
    }
    return { cachedProfiles: cached, missingAddresses: missing }
  }, [normalizedAddresses, entities])

  const { isLoading } = useGetProfilesQuery({ ids: missingAddresses }, { skip: missingAddresses.length === 0 })

  const profilesMap = useMemo(() => {
    const map = new Map<string, PlayerProfile>()
    for (const profile of cachedProfiles) {
      map.set(profile.address, profile)
    }
    return map
  }, [cachedProfiles])

  return { profilesMap, isLoading: isLoading && cachedProfiles.length === 0 }
}

export { usePlayerProfiles }
export type { UsePlayerProfilesResult }
