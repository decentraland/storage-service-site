import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'
import { useAuth } from '@/features/auth'

enum StorageEvent {
  ENV_SET_SUCCESS = 'Storage Env Set Success',
  ENV_SET_FAILURE = 'Storage Env Set Failure',
  ENV_DELETE_SUCCESS = 'Storage Env Delete Success',
  ENV_DELETE_FAILURE = 'Storage Env Delete Failure',
  ENV_CLEAR_SUCCESS = 'Storage Env Clear Success',
  ENV_CLEAR_FAILURE = 'Storage Env Clear Failure',

  SCENE_SET_SUCCESS = 'Storage Scene Set Success',
  SCENE_SET_FAILURE = 'Storage Scene Set Failure',
  SCENE_DELETE_SUCCESS = 'Storage Scene Delete Success',
  SCENE_DELETE_FAILURE = 'Storage Scene Delete Failure',
  SCENE_CLEAR_SUCCESS = 'Storage Scene Clear Success',
  SCENE_CLEAR_FAILURE = 'Storage Scene Clear Failure',

  PLAYER_SET_SUCCESS = 'Storage Player Set Success',
  PLAYER_SET_FAILURE = 'Storage Player Set Failure',
  PLAYER_DELETE_SUCCESS = 'Storage Player Delete Success',
  PLAYER_DELETE_FAILURE = 'Storage Player Delete Failure',
  PLAYER_CLEAR_SUCCESS = 'Storage Player Clear Success',
  PLAYER_CLEAR_FAILURE = 'Storage Player Clear Failure',
  PLAYER_CLEAR_ALL_SUCCESS = 'Storage Player Clear All Success',
  PLAYER_CLEAR_ALL_FAILURE = 'Storage Player Clear All Failure'
}

const useStorageTrack = () => {
  const { track } = useAnalytics()
  const [searchParams] = useSearchParams()
  const { wallet } = useAuth()

  const realm = searchParams.get('realm')
  const position = searchParams.get('position')

  return useCallback(
    (event: StorageEvent) => {
      track(event, {
        realmName: realm ?? undefined,
        parcel: position ?? undefined,
        address: wallet
      })
    },
    [track, realm, position, wallet]
  )
}

export { StorageEvent, useStorageTrack }
