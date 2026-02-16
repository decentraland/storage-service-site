import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { useAuth } from '@/features/auth'
import { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery, useGetUserRentalsQuery } from '../assets.client'
import type { Land, World } from '../assets.types'
import { getLandPosition } from '../assets.utils'
import { LandCard } from './LandCard'
import { WorldCard } from './WorldCard'

const AssetSelectorPage = () => {
  const navigate = useNavigate()
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()

  const { data: rentals } = useGetUserRentalsQuery({ address: wallet ?? '' }, { skip: !wallet })

  const tenantTokenIds = useMemo(() => rentals?.tenantRentals?.map(r => r.tokenId) ?? [], [rentals?.tenantRentals])
  const lessorTokenIds = useMemo(() => rentals?.lessorRentals?.map(r => r.tokenId) ?? [], [rentals?.lessorRentals])

  const landsQueryArgs = useMemo(
    () => ({
      address: wallet ?? '',
      tenantTokenIds,
      lessorTokenIds
    }),
    [wallet, tenantTokenIds, lessorTokenIds]
  )

  const { data: lands, isLoading: landsLoading } = useGetUserLandsQuery(landsQueryArgs, {
    skip: !wallet
  })

  const { data: dclNames, isLoading: namesLoading } = useGetUserDCLNamesQuery({ address: wallet ?? '' }, { skip: !wallet })

  const { data: contributable, isLoading: contribLoading } = useGetContributableDomainsQuery(
    { address: wallet ?? '', wallet, isSignedIn },
    { skip: !wallet }
  )

  const isLoading = landsLoading || namesLoading || contribLoading

  // Combine owned DCL names with contributable domains
  const allWorlds: World[] = useMemo(() => {
    const worlds: World[] = []
    const seen = new Set<string>()

    // DCL names are owned
    for (const name of dclNames ?? []) {
      if (!seen.has(name)) {
        seen.add(name)
        worlds.push({ name, role: 'owner' })
      }
    }

    // Contributable domains are collaborator (unless already in owned list)
    for (const domain of contributable ?? []) {
      if (!seen.has(domain.name)) {
        seen.add(domain.name)
        worlds.push({ name: domain.name, role: 'collaborator' })
      }
    }

    return worlds
  }, [dclNames, contributable])

  const handleSelectLand = useCallback(
    (land: Land) => {
      const position = getLandPosition(land)
      if (position) {
        navigate(`/env?position=${position}`)
      }
    },
    [navigate]
  )

  const handleSelectWorld = useCallback(
    (worldName: string) => {
      navigate(`/env?realm=${worldName}`)
    },
    [navigate]
  )

  const handleWorldClick = useCallback((worldName: string) => () => handleSelectWorld(worldName), [handleSelectWorld])

  const handleLandClick = useCallback((land: Land) => () => handleSelectLand(land), [handleSelectLand])

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
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('select_page.subtitle')}
      </Typography>

      {/* Worlds Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('select_page.worlds')}
      </Typography>
      {allWorlds.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {allWorlds.map(world => (
            <Grid item xs={12} sm={6} md={4} key={world.name}>
              <WorldCard world={world} onClick={handleWorldClick(world.name)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {t('select_page.no_worlds')}
        </Typography>
      )}

      {/* Lands Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('select_page.lands')}
      </Typography>
      {lands && lands.length > 0 ? (
        <Grid container spacing={2}>
          {lands.map(land => (
            <Grid item xs={12} sm={6} md={4} key={land.id}>
              <LandCard land={land} onClick={handleLandClick(land)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary">{t('select_page.no_lands')}</Typography>
      )}
    </Box>
  )
}

export { AssetSelectorPage }
