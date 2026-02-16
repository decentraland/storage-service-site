interface PlayerAddress {
  address: string
}

interface PlayerKey {
  key: string
}

interface PlayerValue {
  key: string
  value: unknown
}

interface ListPlayerKeysParams {
  address: string
}

interface GetPlayerValueParams {
  address: string
  key: string
}

interface SetPlayerValueParams {
  address: string
  key: string
  value: unknown
}

interface DeletePlayerValueParams {
  address: string
  key: string
}

interface ClearPlayerParams {
  address: string
}

interface ListStorageItemsResponse {
  data: Array<{ key: string; value: unknown }>
  pagination: { limit: number; offset: number; total: number }
}

interface StorageValueResponse {
  value: unknown
}

interface ListPlayersResponse {
  data: string[]
  pagination: { limit: number; offset: number; total: number }
}

interface PlayerProfile {
  address: string
  displayName: string
  avatarUrl: string | undefined
  hasClaimedName: boolean
  /** Raw Avatar from @dcl/schemas for use with AvatarFace component */
  avatar: import('@dcl/schemas').Avatar | undefined
}

export type {
  ClearPlayerParams,
  DeletePlayerValueParams,
  GetPlayerValueParams,
  ListPlayerKeysParams,
  ListPlayersResponse,
  ListStorageItemsResponse,
  PlayerAddress,
  PlayerKey,
  PlayerProfile,
  PlayerValue,
  SetPlayerValueParams,
  StorageValueResponse
}
