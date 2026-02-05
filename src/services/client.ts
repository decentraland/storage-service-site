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
  tagTypes: ['Env', 'Scene', 'Player', 'PlayerKeys', 'Permissions', 'UserLands', 'UserDCLNames', 'ContributableDomains'],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({})
})
