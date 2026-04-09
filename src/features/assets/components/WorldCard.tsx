import { memo, useCallback, useState } from 'react'
import type { FC, MouseEvent } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import { Box, Button, ButtonBase, Card, CardActions, CardContent, Chip, CircularProgress, Menu, MenuItem, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import type { World } from '../assets.types'
import { useWorldScenes } from '../hooks'

interface WorldCardProps {
  world: World
  onEditClick: (worldName: string, position?: string) => void
}

const WorldCardComponent: FC<WorldCardProps> = ({ world, onEditClick }) => {
  const { t } = useTranslation()
  const { scenes, sceneCount, firstScene, isMultiScene, isLoading } = useWorldScenes(world.name)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  const handleEditClick = useCallback(() => {
    onEditClick(world.name, firstScene?.baseParcel)
  }, [onEditClick, world.name, firstScene])

  const handleChevronClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleSceneClick = useCallback(
    (baseParcel: string) => () => {
      setAnchorEl(null)
      onEditClick(world.name, baseParcel)
    },
    [onEditClick, world.name]
  )

  const sceneCountLabel = isLoading
    ? undefined
    : sceneCount === 1
      ? t('select_page.scene_count_one')
      : t('select_page.scenes_count', { count: String(sceneCount) })

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <FmdGoodIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            {world.name}
          </Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={14} />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {sceneCountLabel}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
        <Chip label={world.role === 'owner' ? t('common.owner') : t('common.collaborator')} size="small" color="default" />
        <Box>
          {isMultiScene ? (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disableElevation
              onClick={handleEditClick}
              aria-label={t('select_page.edit')}
              sx={{ pr: 0, gap: 0 }}
            >
              {t('select_page.edit')}
              <Box component="span" sx={{ width: '1px', alignSelf: 'stretch', bgcolor: 'rgba(255,255,255,0.3)', mx: 0.5 }} />
              <ButtonBase
                component="span"
                onClick={handleChevronClick}
                aria-label={t('select_page.select_scene')}
                sx={{ display: 'inline-flex', alignItems: 'center', px: 0.25 }}
              >
                <ArrowDropDownIcon fontSize="small" />
              </ButtonBase>
            </Button>
          ) : (
            <Button variant="contained" size="small" color="primary" onClick={handleEditClick} aria-label={t('select_page.edit')}>
              {t('select_page.edit')}
            </Button>
          )}
          <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="overline" color="text.secondary">
                {t('select_page.edit_scenes')}
              </Typography>
            </MenuItem>
            {scenes.map(scene => (
              <MenuItem key={scene.baseParcel} onClick={handleSceneClick(scene.baseParcel)}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                  {scene.title}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </CardActions>
    </Card>
  )
}

const WorldCard = memo(WorldCardComponent)
WorldCard.displayName = 'WorldCard'

export { WorldCard }
export type { WorldCardProps }
