interface EnvKey {
  key: string
}

interface EnvValue {
  key: string
  value: string
}

interface SetEnvParams {
  key: string
  value: string
}

interface DeleteEnvParams {
  key: string
}

export type { DeleteEnvParams, EnvKey, EnvValue, SetEnvParams }
