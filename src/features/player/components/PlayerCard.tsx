import { memo } from 'react'
import type { FC } from 'react'
import { Box, Card, CardActionArea, CardContent, Skeleton } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { Profile } from 'decentraland-ui2'
import type { PlayerProfile } from '../player.types'
import { truncateAddress } from '../player.utils'

interface PlayerCardProps {
  address: string
  profile: PlayerProfile | undefined
  profileLoading: boolean
  onClick: () => void
}

const PlayerCardComponent: FC<PlayerCardProps> = ({ address, profile, profileLoading, onClick }) => {
  const { t } = useTranslation()
  const truncated = truncateAddress(address)

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('player_page.select_player', { address: truncated })}>
        <CardContent>
          {profileLoading ? (
            <Box display="flex" alignItems="center" gap={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton width="60%" height={24} />
            </Box>
          ) : (
            <Profile address={address} avatar={profile?.avatar} showBothNameAndAddress shortenAddress rounded size="normal" />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const PlayerCard = memo(PlayerCardComponent)
PlayerCard.displayName = 'PlayerCard'

export { PlayerCard }
export type { PlayerCardProps }
