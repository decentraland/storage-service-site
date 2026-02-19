import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const client = createApi({
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
    'UserRentals'
  ],
  keepUnusedDataFor: 60,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})
