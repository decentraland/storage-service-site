import { HttpResponse, http } from 'msw'
import { config } from '@/config'

let sceneStore: Record<string, unknown> = {
  leaderboard: { scores: [100, 200, 300] },
  gameState: { level: 1, active: true }
}

const resetSceneStore = () => {
  sceneStore = {
    leaderboard: { scores: [100, 200, 300] },
    gameState: { level: 1, active: true }
  }
}

const sceneHandlers = [
  // List all scene keys
  http.get(`${config.get('STORAGE_API_URL')}/values`, () => {
    return HttpResponse.json(Object.keys(sceneStore).map(key => ({ key })))
  }),

  // Get scene value
  http.get(`${config.get('STORAGE_API_URL')}/values/:key`, ({ params }) => {
    const { key } = params
    const value = sceneStore[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Value not found' }, { status: 404 })
    }
    return HttpResponse.json({ key, value })
  }),

  // Set scene value
  http.put(`${config.get('STORAGE_API_URL')}/values/:key`, async ({ params, request }) => {
    const { key } = params
    const body = (await request.json()) as { value: unknown }
    sceneStore[key as string] = body.value
    return HttpResponse.json({ key, value: body.value })
  }),

  // Delete scene value
  http.delete(`${config.get('STORAGE_API_URL')}/values/:key`, ({ params }) => {
    const { key } = params
    delete sceneStore[key as string]
    return new HttpResponse(null, { status: 204 })
  }),

  // Clear all scene values
  http.delete(`${config.get('STORAGE_API_URL')}/values`, ({ request }) => {
    const confirmHeader = request.headers.get('X-Confirm-Delete-All')
    if (!confirmHeader) {
      return HttpResponse.json({ error: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    sceneStore = {}
    return new HttpResponse(null, { status: 204 })
  })
]

export { resetSceneStore, sceneHandlers }
