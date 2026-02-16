import { Tabs, styled } from '@mui/material'

const AssetSelectorTabs = styled(Tabs)({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    minHeight: 48
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '0 0 3px 3px'
  }
})

export { AssetSelectorTabs }
