import { HttpResponse, http } from 'msw'
import { permissionsHandlers } from './permissions.handlers'

// Base handlers - will be extended by feature-specific handlers
const handlers = [
  // Health check endpoint
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...permissionsHandlers
]

export { handlers }
