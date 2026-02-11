import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { LandType } from '../assets.types'
import type { Land } from '../assets.types'
import { getLandPosition, getRoleLabel } from '../assets.utils'

interface LandCardProps {
  land: Land
  onClick: () => void
}

const LandCard: FC<LandCardProps> = ({ land, onClick }) => {
  const { t } = useTranslation()
  const position = getLandPosition(land)
  const roleLabel = getRoleLabel(land.role)
  const typeLabel = land.type === LandType.PARCEL ? t('select_page.parcel') : t('select_page.estate')

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('select_page.select_land', { name: land.name })}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {land.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {typeLabel}
            {position && ` ${t('select_page.at_position', { position })}`}
            {land.size && ` ${t('select_page.parcels_count', { size: String(land.size) })}`}
          </Typography>
          <Chip label={roleLabel} size="small" color={land.role === 1 ? 'primary' : 'default'} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export { LandCard }
export type { LandCardProps }
