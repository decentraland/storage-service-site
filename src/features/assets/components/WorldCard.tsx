import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import type { World } from '../assets.types'

interface WorldCardProps {
  world: World
  onClick: () => void
}

const WorldCard: FC<WorldCardProps> = ({ world, onClick }) => {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={`Select ${world.name}`}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {world.name}
          </Typography>
          <Chip
            label={world.role === 'owner' ? 'Owner' : 'Collaborator'}
            size="small"
            color={world.role === 'owner' ? 'primary' : 'default'}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export { WorldCard }
export type { WorldCardProps }
