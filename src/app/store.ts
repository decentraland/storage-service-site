import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { client } from '@/services/client'

const rootReducer = combineReducers({
  [client.reducerPath]: client.reducer
})

const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(client.middleware),
    preloadedState
  })
}

const store = setupStore()

type RootState = ReturnType<typeof rootReducer>
type AppStore = ReturnType<typeof setupStore>
type AppDispatch = AppStore['dispatch']

export { setupStore, store, type RootState, type AppStore, type AppDispatch }
