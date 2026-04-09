import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface AuthParams {
  wallet?: string
  isSignedIn?: boolean
}

/** Optional realm/position for cache key — storage is scoped per world/parcel */
interface StorageContext {
  realm?: string | null
  position?: string | null
}

const storageContextId = (realm?: string | null, position?: string | null): string => [realm, position].filter(Boolean).join(':') || ''

const client = createApi({
  reducerPath: 'client',
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    prepareHeaders: headers => {
      headers.set('content-type', 'application/json')
      return headers
    }
  }),
  tagTypes: [
    'Env',
    'Scene',
    'Player',
    'PlayerKeys',
    'Profiles',
    'Permissions',
    'UserLands',
    'UserDCLNames',
    'ContributableDomains',
    'UserRentals',
    'WorldScenes'
  ],
  keepUnusedDataFor: 60,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { client, storageContextId }
export type { AuthParams, StorageContext }
