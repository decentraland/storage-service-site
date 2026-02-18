import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { PlayerProfile } from './player.types'

const profilesAdapter = createEntityAdapter<PlayerProfile, string>({
  selectId: profile => profile.address
})

const profilesSlice = createSlice({
  name: 'profiles',
  initialState: profilesAdapter.getInitialState(),
  reducers: {
    profilesUpsertMany: (state, action) => profilesAdapter.upsertMany(state, action)
  }
})

const { profilesUpsertMany } = profilesSlice.actions
const profilesReducer = profilesSlice.reducer

const { selectById: selectProfileByAddress, selectAll: selectAllProfiles } = profilesAdapter.getSelectors(
  (state: RootState) => state.profiles
)

export { profilesReducer, profilesUpsertMany, selectAllProfiles, selectProfileByAddress }
