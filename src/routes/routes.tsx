import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Env } from '@/pages/Env'
import { NotFound } from '@/pages/NotFound'
import { PlayerDetail } from '@/pages/PlayerDetail'
import { Players } from '@/pages/Players'
import { Scene } from '@/pages/Scene'
import { SelectPage } from '@/pages/Select'

/**
 * Root redirect component.
 * If `realm` or `position` query params are present, redirects to /env with the params.
 * Otherwise, redirects to /select for asset selection.
 */
const RootRedirect = () => {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')

  if (!realm && !position) {
    return <Navigate to="/select" replace />
  }

  return <Navigate to={`/env${window.location.search}`} replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/select" element={<SelectPage />} />
        <Route path="/env" element={<Env />} />
        <Route path="/scene" element={<Scene />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:address" element={<PlayerDetail />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export { AppRoutes, RootRedirect }
