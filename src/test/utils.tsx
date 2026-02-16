import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { type RenderOptions, render as rtlRender } from '@testing-library/react'
import { TranslationProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { type RootState, setupStore } from '@/app/store'
import en from '@/intl/en.json'

const translations = { en }

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: ReturnType<typeof setupStore>
  route?: string
}

const renderWithProviders = (
  ui: ReactElement,
  { preloadedState = {}, store = setupStore(preloadedState), route = '/', ...renderOptions }: ExtendedRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route)

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <TranslationProvider locale="en" translations={translations}>
        <DclThemeProvider theme={darkTheme}>
          <BrowserRouter>{children}</BrowserRouter>
        </DclThemeProvider>
      </TranslationProvider>
    </Provider>
  )

  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export * from '@testing-library/react'
export { renderWithProviders }
