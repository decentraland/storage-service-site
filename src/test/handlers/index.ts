import { HttpResponse, http } from 'msw'
import { permissionsHandlers } from './permissions.handlers'
import { resetStorageApiStores, storageApiHandlers } from './storage-api.handlers'

const handlers = [
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...permissionsHandlers,
  ...storageApiHandlers
]

export { handlers, resetStorageApiStores }
