import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import { useAuth } from '@/features/auth'
import { useSignedFetch } from '@/hooks/useSignedFetch'
import { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery } from '../assets.client'
import type { Land, World } from '../assets.types'
import { getLandPosition } from '../assets.utils'
import { LandCard } from './LandCard'
import { WorldCard } from './WorldCard'

const AssetSelectorPage = () => {
  const navigate = useNavigate()
  const { wallet } = useAuth()
  const signedFetch = useSignedFetch()

  const { data: lands, isLoading: landsLoading } = useGetUserLandsQuery({ address: wallet ?? '' }, { skip: !wallet })

  const { data: dclNames, isLoading: namesLoading } = useGetUserDCLNamesQuery({ address: wallet ?? '' }, { skip: !wallet })

  const { data: contributable, isLoading: contribLoading } = useGetContributableDomainsQuery(
    { address: wallet ?? '', signedFetch },
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress aria-label="Loading assets" />
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Select Asset to Manage
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose a world or land parcel to manage its storage.
      </Typography>

      {/* Worlds Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Worlds
      </Typography>
      {allWorlds.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {allWorlds.map(world => (
            <Grid item xs={12} sm={6} md={4} key={world.name}>
              <WorldCard world={world} onClick={() => handleSelectWorld(world.name)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          No worlds found
        </Typography>
      )}

      {/* Lands Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Lands
      </Typography>
      {lands && lands.length > 0 ? (
        <Grid container spacing={2}>
          {lands.map(land => (
            <Grid item xs={12} sm={6} md={4} key={land.id}>
              <LandCard land={land} onClick={() => handleSelectLand(land)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary">No lands found</Typography>
      )}
    </Box>
  )
}

export { AssetSelectorPage }
