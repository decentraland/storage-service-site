import { Env, createConfig } from '@dcl/ui-env'
import dev from './env/dev.json'
import prod from './env/prd.json'

const config = createConfig(
  {
    [Env.DEVELOPMENT as string]: {
      ...dev,
      SEGMENT_API_KEY: import.meta.env.VITE_SEGMENT_DEV_API_KEY ?? ''
    },
    [Env.PRODUCTION as string]: {
      ...prod,
      SEGMENT_API_KEY: import.meta.env.VITE_SEGMENT_PRD_API_KEY ?? ''
    }
  },
  {
    systemEnvVariables: {
      REACT_APP_DCL_DEFAULT_ENV: import.meta.env.VITE_REACT_APP_DCL_DEFAULT_ENV ?? 'dev'
    }
  }
)

export { config }
