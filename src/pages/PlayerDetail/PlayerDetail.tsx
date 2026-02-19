import { Navigate, useParams } from 'react-router-dom'
import { PlayerDetailPage } from '@/features/player/components/PlayerDetailPage'

const PlayerDetail = () => {
  const { address } = useParams<{ address: string }>()

  if (!address) {
    return <Navigate to="/players" replace />
  }

  return <PlayerDetailPage address={address} />
}

export { PlayerDetail }
