import { HttpResponse, http } from 'msw'
import { permissionsHandlers } from './permissions.handlers'
import { profilesHandlers } from './profiles.handlers'
import { resetStorageApiStores, storageApiHandlers } from './storage-api.handlers'
import { subgraphsHandlers } from './subgraphs.handlers'
import { worldsContentServerHandlers } from './worlds-content-server.handlers'

const handlers = [
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...worldsContentServerHandlers,
  ...permissionsHandlers,
  ...profilesHandlers,
  ...storageApiHandlers,
  ...subgraphsHandlers
]

export { handlers, resetStorageApiStores }
