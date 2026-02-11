import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import type { World } from '../assets.types'

interface WorldCardProps {
  world: World
  onClick: () => void
}

const WorldCard: FC<WorldCardProps> = ({ world, onClick }) => {
  const { t } = useTranslation()

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('select_page.select_world', { name: world.name })}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {world.name}
          </Typography>
          <Chip
            label={world.role === 'owner' ? t('common.owner') : t('common.collaborator')}
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
