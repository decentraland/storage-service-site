import { Env, createConfig } from '@dcl/ui-env'
import dev from './env/dev.json'
import prod from './env/prd.json'

const config = createConfig(
  {
    [Env.DEVELOPMENT as string]: dev,
    [Env.PRODUCTION as string]: prod
  },
  {
    systemEnvVariables: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      REACT_APP_DCL_DEFAULT_ENV: import.meta.env.VITE_REACT_APP_DCL_DEFAULT_ENV ?? 'dev'
    }
  }
)

export { config }
