import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import { LandType } from '../assets.types'
import type { Land } from '../assets.types'
import { getLandPosition, getRoleLabel } from '../assets.utils'

interface LandCardProps {
  land: Land
  onClick: () => void
}

const LandCard: FC<LandCardProps> = ({ land, onClick }) => {
  const position = getLandPosition(land)
  const roleLabel = getRoleLabel(land.role)
  const typeLabel = land.type === LandType.PARCEL ? 'Parcel' : 'Estate'

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={`Select ${land.name}`}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {land.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {typeLabel}
            {position && ` at ${position}`}
            {land.size && ` (${land.size} parcels)`}
          </Typography>
          <Chip label={roleLabel} size="small" color={land.role === 1 ? 'primary' : 'default'} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export { LandCard }
export type { LandCardProps }
