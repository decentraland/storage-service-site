import { useCallback, useMemo, useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import StorageIcon from '@mui/icons-material/Storage'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { Divider, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { HeaderLabel, NavItemButton, NavItemIcon, NavList, SidebarHeader, StyledDrawer } from './Sidebar.styled'

const DRAWER_WIDTH_EXPANDED = 240
const DRAWER_WIDTH_COLLAPSED = 56
const LOCAL_STORAGE_KEY = 'sidebar-collapsed'

const getInitialCollapsed = (): boolean => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const STORAGE_ICON = <StorageIcon />
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
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed)

  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const assetLabel = realm ?? position ?? ''

  const navItems: NavItem[] = useMemo(
    () => [
      { label: t('sidebar.storages'), icon: STORAGE_ICON, route: '/select', preserveParams: false },
      { label: t('sidebar.environment'), icon: SETTINGS_ICON, route: '/env', preserveParams: true },
      { label: t('sidebar.scene'), icon: VIEW_IN_AR_ICON, route: '/scene', preserveParams: true },
      { label: t('sidebar.player'), icon: PEOPLE_ICON, route: '/players', preserveParams: true }
    ],
    [t]
  )

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }, [])

  const handleNavigate = useCallback(
    (item: NavItem) => {
      const search = item.preserveParams ? window.location.search : ''
      navigate(`${item.route}${search}`)
    },
    [navigate]
  )

  const drawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED

  return (
    <StyledDrawer variant="permanent" drawerWidth={drawerWidth}>
      <SidebarHeader isCollapsed={isCollapsed}>
        {!isCollapsed && (
          <HeaderLabel>
            <FmdGoodIcon fontSize="small" color="action" />
            <Tooltip title={assetLabel}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                {assetLabel || t('sidebar.storages')}
              </Typography>
            </Tooltip>
          </HeaderLabel>
        )}
        <Tooltip title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')} placement="right">
          <IconButton onClick={handleToggleCollapse} size="small" aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}>
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </SidebarHeader>

      <Divider />

      <NavList>
        {navItems.map((item, index) => {
          const isActive = item.route === '/select' ? location.pathname === '/select' : location.pathname.startsWith(item.route)
          const isFirstGroup = index === 0

          return (
            <div key={item.route}>
              {isFirstGroup ? null : index === 1 ? <Divider sx={{ my: 0.5 }} /> : null}
              <Tooltip title={isCollapsed ? item.label : ''} placement="right">
                <NavItemButton selected={isActive} isCollapsed={isCollapsed} onClick={() => handleNavigate(item)} aria-label={item.label}>
                  <NavItemIcon isCollapsed={isCollapsed} isActive={isActive}>
                    {item.icon}
                  </NavItemIcon>
                  {!isCollapsed && <ListItemText primary={item.label} />}
                </NavItemButton>
              </Tooltip>
            </div>
          )
        })}
      </NavList>
    </StyledDrawer>
  )
}

export { Sidebar }
