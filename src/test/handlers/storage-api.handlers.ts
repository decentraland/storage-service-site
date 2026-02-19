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

let playerStore: Record<string, Record<string, unknown>> = {
  '0xplayer1': {
    inventory: { sword: 1, shield: 2 },
    progress: { quest1: 'completed' }
  },
  '0xplayer2': {
    inventory: { bow: 1 }
  }
}

let envStore: Record<string, string> = {
  API_KEY: 'secret-key',
  DATABASE_URL: 'postgres://localhost:5432/db'
}

const resetStorageApiStores = () => {
  worldStore = {
    leaderboard: { scores: [100, 200, 300] },
    gameState: { level: 1, active: true }
  }
  playerStore = {
    '0xplayer1': {
      inventory: { sword: 1, shield: 2 },
      progress: { quest1: 'completed' }
    },
    '0xplayer2': {
      inventory: { bow: 1 }
    }
  }
  envStore = {
    API_KEY: 'secret-key',
    DATABASE_URL: 'postgres://localhost:5432/db'
  }
}

const confirmDeleteAll = (request: Request) => request.headers.get('X-Confirm-Delete-All')

/** OpenAPI ListStorageItemsResponse / ListEnvKeysResponse pagination */
const pagination = (total: number, limit = 100, offset = 0) => ({ limit, offset, total })

const storageApiHandlers = [
  // --- World Storage (OpenAPI: /values, /values/{key}) ---
  http.get(`${baseUrl()}/values/:key`, ({ params }) => {
    const { key } = params
    const value = worldStore[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Value not found' }, { status: 404 })
    }
    return HttpResponse.json({ value })
  }),
  http.put(`${baseUrl()}/values/:key`, async ({ params, request }) => {
    const { key } = params
    const body = (await request.json()) as { value: unknown }
    worldStore[key as string] = body.value
    return HttpResponse.json({ value: body.value })
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

  // List world storage (OpenAPI: ListStorageItemsResponse)
  http.get(`${baseUrl()}/values`, ({ request }) => {
    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100', 10) || 100))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const keys = Object.keys(worldStore).sort()
    const total = keys.length
    const data = keys.slice(offset, offset + limit).map(key => ({ key, value: worldStore[key] }))
    return HttpResponse.json({ data, pagination: pagination(total, limit, offset) })
  }),

  // --- Player Storage (OpenAPI: /players, /players/{address}/values, /players/{address}/values/{key}) ---
  http.get(`${baseUrl()}/players/:address/values/:key`, ({ params }) => {
    const { address, key } = params
    const value = playerStore[address as string]?.[key as string]
    if (value === undefined) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({ value })
  }),
  http.put(`${baseUrl()}/players/:address/values/:key`, async ({ params, request }) => {
    const { address, key } = params
    const body = (await request.json()) as { value: unknown }
    if (!playerStore[address as string]) {
      playerStore[address as string] = {}
    }
    playerStore[address as string][key as string] = body.value
    return HttpResponse.json({ value: body.value })
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

  // List players (OpenAPI: ListPlayersResponse)
  http.get(`${baseUrl()}/players`, ({ request }) => {
    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100', 10) || 100))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const addresses = Object.keys(playerStore).sort()
    const total = addresses.length
    const data = addresses.slice(offset, offset + limit)
    return HttpResponse.json({ data, pagination: pagination(total, limit, offset) })
  }),

  // List player storage for an address (OpenAPI: ListStorageItemsResponse)
  http.get(`${baseUrl()}/players/:address/values`, ({ params, request }) => {
    const { address } = params
    const playerData = playerStore[address as string]
    if (!playerData) {
      return HttpResponse.json({ data: [], pagination: pagination(0) })
    }
    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100', 10) || 100))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const keys = Object.keys(playerData).sort()
    const total = keys.length
    const data = keys.slice(offset, offset + limit).map(key => ({ key, value: playerData[key] }))
    return HttpResponse.json({ data, pagination: pagination(total, limit, offset) })
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

  // List env keys (OpenAPI: ListEnvKeysResponse - key names only)
  http.get(`${baseUrl()}/env`, ({ request }) => {
    const url = new URL(request.url)
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const data = Object.keys(envStore).sort()
    const total = data.length
    const page = data.slice(offset, offset + limit)
    return HttpResponse.json({ data: page, pagination: pagination(total, limit, offset) })
  })
]

export { resetStorageApiStores, storageApiHandlers }
