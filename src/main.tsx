import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { store } from '@/app/store'
import { App } from './App'

const root = document.getElementById('root')!

const render = () => {
  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <DclThemeProvider theme={darkTheme}>
          <App />
        </DclThemeProvider>
      </Provider>
    </StrictMode>
  )
}

if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === 'true') {
  import('@/mocks/browser').then(({ startMockServiceWorker }) => startMockServiceWorker().then(render))
} else {
  render()
}
