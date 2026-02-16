import { memo } from 'react'
import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import type { Land } from '../assets.types'
import { getRoleLabel } from '../assets.utils'

interface LandCardProps {
  land: Land
  onClick: () => void
}

const LandCardComponent: FC<LandCardProps> = ({ land, onClick }) => {
  const { t } = useTranslation()
  const roleLabel = getRoleLabel(land.role)

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('select_page.select_land', { name: land.name })}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {land.name}
          </Typography>
          <Chip label={roleLabel} size="small" color={land.role === 1 ? 'primary' : 'default'} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const LandCard = memo(LandCardComponent)
LandCard.displayName = 'LandCard'

export { LandCard }
export type { LandCardProps }
