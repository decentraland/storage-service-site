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

export type {
  ClearPlayerParams,
  DeletePlayerValueParams,
  GetPlayerValueParams,
  ListPlayerKeysParams,
  PlayerAddress,
  PlayerKey,
  PlayerValue,
  SetPlayerValueParams
}
