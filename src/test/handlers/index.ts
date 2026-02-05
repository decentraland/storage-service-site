import { HttpResponse, http } from 'msw'
import { envHandlers } from './env.handlers'
import { permissionsHandlers } from './permissions.handlers'
import { sceneHandlers } from './scene.handlers'

// Base handlers - will be extended by feature-specific handlers
const handlers = [
  // Health check endpoint
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...permissionsHandlers,
  ...envHandlers,
  ...sceneHandlers
]

export { handlers }
