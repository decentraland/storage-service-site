/**
 * MSW handlers for World Storage Service API (OpenAPI-aligned).
 * Covers all endpoints from https://github.com/decentraland/world-storage-service/blob/main/docs/openapi.yaml
 * plus list endpoints used by the app (GET /env, GET /values, GET /players, GET /players/:address/values).
 */

import { HttpResponse, http } from 'msw'
import { config } from '@/config'

const baseUrl = () => config.get('STORAGE_API_URL')

// In-memory stores (OpenAPI: world-scoped; mock is single-tenant for simplicity)
let worldStore: Record<string, unknown> = {
  leaderboard: { scores: [100, 200, 300] },
  gameState: { level: 1, active: true }
}

/* eslint-disable @typescript-eslint/naming-convention -- wallet addresses as keys */
let playerStore: Record<string, Record<string, unknown>> = {
  '0xplayer1': {
    inventory: { sword: 1, shield: 2 },
    progress: { quest1: 'completed' }
  },
  '0xplayer2': {
    inventory: { bow: 1 }
  }
}
/* eslint-enable @typescript-eslint/naming-convention */

let envStore: Record<string, string> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  API_KEY: 'secret-key',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: 'postgres://localhost:5432/db'
}

const resetStorageApiStores = () => {
  worldStore = {
    leaderboard: { scores: [100, 200, 300] },
    gameState: { level: 1, active: true }
  }
  /* eslint-disable @typescript-eslint/naming-convention -- wallet addresses as keys */
  playerStore = {
    '0xplayer1': {
      inventory: { sword: 1, shield: 2 },
      progress: { quest1: 'completed' }
    },
    '0xplayer2': {
      inventory: { bow: 1 }
    }
  }
  /* eslint-enable @typescript-eslint/naming-convention */
  envStore = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    API_KEY: 'secret-key',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DATABASE_URL: 'postgres://localhost:5432/db'
  }
}

const confirmDeleteAll = (request: Request) => request.headers.get('X-Confirm-Delete-All')

const storageApiHandlers = [
  // --- World Storage (OpenAPI: /values, /values/{key}) ---
  http.get(`${baseUrl()}/values/:key`, ({ params }) => {
    const { key } = params
    const value = worldStore[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Value not found' }, { status: 404 })
    }
    // App expects { key, value }; OpenAPI specifies { value } only
    return HttpResponse.json({ key, value })
  }),
  http.put(`${baseUrl()}/values/:key`, async ({ params, request }) => {
    const { key } = params
    const body = (await request.json()) as { value: unknown }
    worldStore[key as string] = body.value
    return HttpResponse.json({ key, value: body.value })
  }),
  http.delete(`${baseUrl()}/values/:key`, ({ params }) => {
    const { key } = params
    delete worldStore[key as string]
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${baseUrl()}/values`, ({ request }) => {
    if (!confirmDeleteAll(request)) {
      return HttpResponse.json({ error: 'Bad request', message: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    worldStore = {}
    return new HttpResponse(null, { status: 204 })
  }),

  // List world keys (not in OpenAPI; for app compatibility)
  http.get(`${baseUrl()}/values`, () => {
    return HttpResponse.json(Object.keys(worldStore).map(key => ({ key })))
  }),

  // --- Player Storage (OpenAPI: /players, /players/{address}/values, /players/{address}/values/{key}) ---
  http.get(`${baseUrl()}/players/:address/values/:key`, ({ params }) => {
    const { address, key } = params
    const value = playerStore[address as string]?.[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    // App expects { key, value }; OpenAPI specifies { value } only
    return HttpResponse.json({ key, value })
  }),
  http.put(`${baseUrl()}/players/:address/values/:key`, async ({ params, request }) => {
    const { address, key } = params
    const body = (await request.json()) as { value: unknown }
    if (!playerStore[address as string]) {
      playerStore[address as string] = {}
    }
    playerStore[address as string][key as string] = body.value
    return HttpResponse.json({ key, value: body.value })
  }),
  http.delete(`${baseUrl()}/players/:address/values/:key`, ({ params }) => {
    const { address, key } = params
    delete playerStore[address as string]?.[key as string]
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${baseUrl()}/players/:address/values`, ({ params, request }) => {
    const { address } = params
    if (!confirmDeleteAll(request)) {
      return HttpResponse.json({ error: 'Bad request', message: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    delete playerStore[address as string]
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${baseUrl()}/players`, ({ request }) => {
    if (!confirmDeleteAll(request)) {
      return HttpResponse.json({ error: 'Bad request', message: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    playerStore = {}
    return new HttpResponse(null, { status: 204 })
  }),

  // List players and list player keys (not in OpenAPI; for app compatibility)
  http.get(`${baseUrl()}/players`, () => {
    return HttpResponse.json(Object.keys(playerStore).map(address => ({ address })))
  }),
  http.get(`${baseUrl()}/players/:address/values`, ({ params }) => {
    const { address } = params
    const playerData = playerStore[address as string]
    if (!playerData) {
      return HttpResponse.json([])
    }
    return HttpResponse.json(Object.keys(playerData).map(key => ({ key })))
  }),

  // --- Env Storage (OpenAPI: /env, /env/{key}) ---
  http.get(`${baseUrl()}/env/:key`, ({ params }) => {
    const { key } = params
    const value = envStore[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Value not found' }, { status: 404 })
    }
    return HttpResponse.json({ value })
  }),
  http.put(`${baseUrl()}/env/:key`, async ({ params, request }) => {
    const { key } = params
    const body = (await request.json()) as { value: string }
    envStore[key as string] = body.value
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${baseUrl()}/env/:key`, ({ params }) => {
    const { key } = params
    delete envStore[key as string]
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${baseUrl()}/env`, ({ request }) => {
    if (!confirmDeleteAll(request)) {
      return HttpResponse.json({ error: 'Bad request', message: 'Missing required header: X-Confirm-Delete-All' }, { status: 400 })
    }
    envStore = {}
    return new HttpResponse(null, { status: 204 })
  }),

  // List env keys (not in OpenAPI; for app compatibility)
  http.get(`${baseUrl()}/env`, () => {
    return HttpResponse.json(Object.keys(envStore).map(key => ({ key })))
  })
]

export { resetStorageApiStores, storageApiHandlers }
