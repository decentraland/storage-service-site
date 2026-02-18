import { useCallback, useState } from 'react'
import type { FC, ReactNode, SyntheticEvent } from 'react'
import { Box, CircularProgress, Tab, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { useGetLands, useGetWorlds } from '../hooks'
import { LandsTabPanel, WorldsTabPanel } from './tabs'
import { AssetSelectorTabs } from './AssetSelectorPage.styled'

interface TabPanelProps {
  children: ReactNode
  value: number
  index: number
}

const TabPanel: FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) {
    return null
  }

  return (
    <Box role="tabpanel" id={`asset-tabpanel-${index}`} aria-labelledby={`asset-tab-${index}`} sx={{ pt: 3 }}>
      {children}
    </Box>
  )
}

const AssetSelectorPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const { allWorlds, isLoading: worldsLoading } = useGetWorlds()
  const { lands, isLoading: landsLoading } = useGetLands()

  const isLoading = worldsLoading || landsLoading
  const allLands = lands ?? []

  const handleTabChange = useCallback((_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress aria-label={t('select_page.loading')} />
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {t('select_page.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('select_page.subtitle')}
      </Typography>

      <AssetSelectorTabs value={activeTab} onChange={handleTabChange} aria-label="asset type tabs">
        <Tab label={`${t('select_page.worlds')} (${allWorlds.length})`} id="asset-tab-0" aria-controls="asset-tabpanel-0" />
        <Tab label={`${t('select_page.lands')} (${allLands.length})`} id="asset-tab-1" aria-controls="asset-tabpanel-1" />
      </AssetSelectorTabs>

      <TabPanel value={activeTab} index={0}>
        <WorldsTabPanel worlds={allWorlds} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <LandsTabPanel lands={allLands} />
      </TabPanel>
    </Box>
  )
}

export { AssetSelectorPage }
