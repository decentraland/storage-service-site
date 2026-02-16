import styled from '@emotion/styled'
import { Box, Drawer, List, ListItemButton, ListItemIcon } from '@mui/material'
import type { Theme } from '@mui/material/styles'

const NAVBAR_HEIGHT = 64

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== 'drawerWidth'
})<{ drawerWidth: number }>(({ drawerWidth }) => ({
  width: drawerWidth,
  flexShrink: 0,
  transition: 'width 0.2s ease',
  paddingTop: NAVBAR_HEIGHT,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    transition: 'width 0.2s ease',
    overflowX: 'hidden' as const,
    borderRight: '1px solid',
    borderColor: 'divider',
    position: 'relative' as const
  }
}))

const SidebarHeader = styled(Box, {
  shouldForwardProp: prop => prop !== 'isCollapsed'
})<{ isCollapsed: boolean }>(({ isCollapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  minHeight: 48,
  gap: 8,
  paddingInline: isCollapsed ? 6 : 16,
  justifyContent: isCollapsed ? 'center' : 'flex-start'
}))

const HeaderLabel = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0
})

const NavList = styled(List)({
  flex: 1,
  paddingTop: 4
})

const NavItemButton = styled(ListItemButton, {
  shouldForwardProp: prop => prop !== 'isCollapsed'
})<{ isCollapsed: boolean }>(({ isCollapsed }) => ({
  minHeight: 44,
  justifyContent: isCollapsed ? 'center' : 'initial',
  paddingInline: isCollapsed ? 12 : 20
}))

const NavItemIcon = styled(ListItemIcon, {
  shouldForwardProp: prop => prop !== 'isCollapsed' && prop !== 'isActive'
})<{ isCollapsed: boolean; isActive: boolean }>(({ isCollapsed, isActive, theme }) => ({
  minWidth: 0,
  marginRight: isCollapsed ? 0 : 16,
  justifyContent: 'center',
  color: isActive ? (theme as Theme).palette.primary.main : 'inherit'
}))

export { HeaderLabel, NavItemButton, NavItemIcon, NavList, SidebarHeader, StyledDrawer }
