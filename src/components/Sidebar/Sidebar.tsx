import { useCallback, useMemo, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { Collapse, List, ListItemText, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { useGetWorldScenesQuery } from '@/features/assets/assets.client'
import {
  BackLink,
  HeaderLabel,
  NavItemButton,
  NavItemIcon,
  NavList,
  SceneListItem,
  SceneSelectorButton,
  SidebarHeader,
  StyledDrawer
} from './Sidebar.styled'

const DRAWER_WIDTH = 240

const SETTINGS_ICON = <SettingsIcon />
const VIEW_IN_AR_ICON = <ViewInArIcon />
const PEOPLE_ICON = <PeopleIcon />

interface NavItem {
  label: string
  icon: ReactNode
  route: string
  preserveParams: boolean
}

const Sidebar: FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [sceneSelectorOpen, setSceneSelectorOpen] = useState(false)

  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const assetLabel = realm ?? position ?? ''

  const { data: scenes } = useGetWorldScenesQuery({ worldName: realm ?? '' }, { skip: !realm })
  const isMultiScene = (scenes?.length ?? 0) > 1
  const currentScene = scenes?.find(s => s.baseParcel === position)
  const currentSceneTitle = currentScene?.title ?? scenes?.[0]?.title

  const navItems: NavItem[] = useMemo(
    () => [
      { label: t('sidebar.environment'), icon: SETTINGS_ICON, route: '/env', preserveParams: true },
      { label: t('sidebar.scene'), icon: VIEW_IN_AR_ICON, route: '/scene', preserveParams: true },
      { label: t('sidebar.player'), icon: PEOPLE_ICON, route: '/players', preserveParams: true }
    ],
    [t]
  )

  const handleBack = useCallback(() => {
    navigate('/select')
  }, [navigate])

  const handleNavigate = useCallback(
    (item: NavItem) => {
      const search = item.preserveParams ? window.location.search : ''
      navigate(`${item.route}${search}`)
    },
    [navigate]
  )

  const handleSceneSelect = useCallback(
    (baseParcel: string) => {
      const params = new URLSearchParams(searchParams)
      params.set('position', baseParcel)
      navigate(`${location.pathname}?${params.toString()}`)
    },
    [navigate, location.pathname, searchParams]
  )

  const handleToggleSceneSelector = useCallback(() => {
    setSceneSelectorOpen(prev => !prev)
  }, [])

  return (
    <StyledDrawer variant="permanent" drawerWidth={DRAWER_WIDTH}>
      {/* Back link */}
      <BackLink onClick={handleBack} role="button" aria-label={t('sidebar.back')}>
        <ArrowBackIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          {t('sidebar.back')}
        </Typography>
      </BackLink>

      {/* World name header */}
      <SidebarHeader sx={{ backgroundColor: '#242129', borderBottom: '1px solid #43404A' }}>
        <HeaderLabel>
          <FmdGoodIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" noWrap color="text.secondary" fontWeight={600}>
            {assetLabel}
          </Typography>
        </HeaderLabel>
      </SidebarHeader>

      {/* Scene selector for multi-scene worlds */}
      {isMultiScene && realm && (
        <>
          <SceneSelectorButton onClick={handleToggleSceneSelector}>
            <Typography variant="body2" color="primary" fontWeight={600} noWrap>
              {currentSceneTitle}
            </Typography>
            {sceneSelectorOpen ? <ExpandLessIcon fontSize="small" color="primary" /> : <ExpandMoreIcon fontSize="small" color="primary" />}
          </SceneSelectorButton>
          <Collapse in={sceneSelectorOpen} timeout="auto" unmountOnExit>
            <List disablePadding>
              {scenes?.map(scene => (
                <SceneListItem
                  key={scene.baseParcel}
                  selected={scene.baseParcel === position}
                  onClick={() => handleSceneSelect(scene.baseParcel)}
                >
                  <ListItemText primary={scene.title} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
                </SceneListItem>
              ))}
            </List>
          </Collapse>
        </>
      )}

      {/* Storage nav items */}
      <NavList disablePadding>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.route)

          return (
            <NavItemButton key={item.route} selected={isActive} onClick={() => handleNavigate(item)} aria-label={item.label}>
              <NavItemIcon isActive={isActive}>{item.icon}</NavItemIcon>
              <ListItemText primary={item.label} />
            </NavItemButton>
          )
        })}
      </NavList>
    </StyledDrawer>
  )
}

export { Sidebar }
