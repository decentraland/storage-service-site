import { HttpResponse, http } from 'msw'
import { config } from '@/config'

let envStore: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  API_KEY: 'secret-key',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: 'postgres://localhost:5432/db'
}

const resetEnvStore = () => {
  envStore = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    API_KEY: 'secret-key',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DATABASE_URL: 'postgres://localhost:5432/db'
  }
}

const envHandlers = [
  // List all env keys
  http.get(`${config.get('STORAGE_API_URL')}/env`, () => {
    return HttpResponse.json(Object.keys(envStore).map(key => ({ key })))
  }),

  // Set env value
  http.put(`${config.get('STORAGE_API_URL')}/env/:key`, async ({ params, request }) => {
    const { key } = params
    const body = (await request.json()) as { value: string }
    envStore[key as string] = body.value
    return new HttpResponse(null, { status: 204 })
  }),

  // Delete env value
  http.delete(`${config.get('STORAGE_API_URL')}/env/:key`, ({ params }) => {
    const { key } = params
    delete envStore[key as string]
    return new HttpResponse(null, { status: 204 })
  }),

  // Clear all env values
  http.delete(`${config.get('STORAGE_API_URL')}/env`, ({ request }) => {
    const confirmHeader = request.headers.get('X-Confirm-Delete-All')
    if (!confirmHeader) {
      return HttpResponse.json({ error: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    envStore = {}
    return new HttpResponse(null, { status: 204 })
  })
]

export { envHandlers, resetEnvStore }
