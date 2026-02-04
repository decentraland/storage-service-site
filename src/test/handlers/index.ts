import { HttpResponse, http } from 'msw'

// Base handlers - will be extended by feature-specific handlers
export const handlers = [
  // Health check endpoint
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' })
  })
]
