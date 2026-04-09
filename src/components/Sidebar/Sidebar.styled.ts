import styled from '@emotion/styled'
import { Box, ButtonBase, Drawer, List, ListItemButton, ListItemIcon } from '@mui/material'
import type { Theme } from '@mui/material/styles'

const NAVBAR_HEIGHT = 64

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== 'drawerWidth'
})<{ drawerWidth: number }>(({ drawerWidth }) => ({
  width: drawerWidth,
  flexShrink: 0,
  paddingTop: NAVBAR_HEIGHT,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    overflowX: 'hidden' as const,
    borderRight: 'none',
    position: 'relative' as const,
    zIndex: 1
  }
}))

const BackLink = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  paddingInline: 16,
  paddingBlock: 16,
  justifyContent: 'flex-start',
  backgroundColor: '#1D1C20',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': { backgroundColor: (theme as Theme).palette.action.hover }
}))

const SidebarHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  minHeight: 40,
  gap: 8,
  paddingInline: 16,
  paddingBlock: 16
})

const HeaderLabel = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0
})

const NavList = styled(List)({
  flex: 1
})

const NavItemButton = styled(ListItemButton)({
  minHeight: 44,
  paddingInline: 20
})

const NavItemIcon = styled(ListItemIcon, {
  shouldForwardProp: prop => prop !== 'isActive'
})<{ isActive: boolean }>(({ isActive, theme }) => ({
  minWidth: 0,
  marginRight: 16,
  justifyContent: 'center',
  color: isActive ? (theme as Theme).palette.primary.main : 'inherit'
}))

const SceneSelectorButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  width: '100%',
  paddingInline: 16,
  paddingTop: 24,
  paddingBottom: 8,
  justifyContent: 'space-between',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': { backgroundColor: (theme as Theme).palette.action.hover }
}))

const SceneListItem = styled(ListItemButton)({
  paddingLeft: 32,
  paddingBlock: 4,
  minHeight: 36
})

export { BackLink, HeaderLabel, NavItemButton, NavItemIcon, NavList, SceneListItem, SceneSelectorButton, SidebarHeader, StyledDrawer }
