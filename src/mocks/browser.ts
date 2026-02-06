/**
 * MSW browser worker: run the app against full mocks (Storage API, Worlds Content Server, catalyst/peer, subgraphs).
 * Enable with VITE_USE_MSW=true when running `npm run dev`.
 */
import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { assetsHandlers } from '@/test/handlers/assets.handlers'
import { permissionsHandlers } from '@/test/handlers/permissions.handlers'
import { storageApiHandlers } from '@/test/handlers/storage-api.handlers'
import { worldsContentServerHandlers } from '@/test/handlers/worlds-content-server.handlers'

const healthHandler = http.get('/health', () => {
  return HttpResponse.json({ status: 'ok' })
})

const worker = setupWorker(healthHandler, ...worldsContentServerHandlers, ...permissionsHandlers, ...storageApiHandlers, ...assetsHandlers)

export const startMockServiceWorker = (): Promise<void> => worker.start()
