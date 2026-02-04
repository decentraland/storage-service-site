import { Route, Routes } from 'react-router-dom'
import { Env } from '@/pages/Env'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { Players } from '@/pages/Players'
import { Scene } from '@/pages/Scene'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/env" element={<Env />} />
      <Route path="/scene" element={<Scene />} />
      <Route path="/players" element={<Players />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export { AppRoutes }
