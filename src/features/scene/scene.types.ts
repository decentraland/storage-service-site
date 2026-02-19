interface SceneKey {
  key: string
}

interface SceneValue {
  key: string
  value: unknown
}

interface GetSceneValueParams {
  key: string
}

interface SetSceneValueParams {
  key: string
  value: unknown
}

interface DeleteSceneValueParams {
  key: string
}

export type { DeleteSceneValueParams, GetSceneValueParams, SceneKey, SceneValue, SetSceneValueParams }
