import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { store } from '@/app/store'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <DclThemeProvider theme={darkTheme}>
        <App />
      </DclThemeProvider>
    </Provider>
  </StrictMode>
)
