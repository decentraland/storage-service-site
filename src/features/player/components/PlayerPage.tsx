import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, CircularProgress, Grid, Pagination, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SearchField } from '@/components/SearchField'
import { usePaginatedSearch } from '@/features/assets'
import { useAuth } from '@/features/auth'
import { useDialogState } from '@/hooks'
import { StorageEvent, useStorageTrack } from '@/lib/analytics'
import { usePlayerProfiles } from '../hooks'
import { useClearAllPlayersMutation, useListPlayersQuery, useSetPlayerValueMutation } from '../player.client'
import { AddValueDialog } from './AddValueDialog'
import { PlayerCard } from './PlayerCard'

interface PlayerListViewProps {
  players: string[]
  onSelectPlayer: (address: string) => void
}

const PlayerListView = ({ players, onSelectPlayer }: PlayerListViewProps) => {
  const { t } = useTranslation()

  const { profilesMap, isLoading: profilesLoading } = usePlayerProfiles(players)

  const playerFilterFn = useCallback(
    (address: string, query: string): boolean => {
      if (address.toLowerCase().includes(query)) {
        return true
      }
      const profile = profilesMap.get(address.toLowerCase())
      return profile?.displayName.toLowerCase().includes(query) ?? false
    },
    [profilesMap]
  )

  const { search, page, paginatedItems, pageCount, totalFiltered, start, end, handleSearchChange, handleClearSearch, handlePageChange } =
    usePaginatedSearch({ items: players, filterFn: playerFilterFn })

  const handlePlayerClick = useCallback((address: string) => () => onSelectPlayer(address), [onSelectPlayer])

  return (
    <>
      <SearchField value={search} onChange={handleSearchChange} onClear={handleClearSearch} placeholder={t('player_page.search_players')} />

      {players.length === 0 ? (
        <Typography color="text.secondary">{t('player_page.no_players')}</Typography>
      ) : totalFiltered === 0 ? (
        <Typography color="text.secondary">{t('player_page.no_search_results', { query: search })}</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedItems.map(address => (
              <Grid item xs={12} sm={6} md={4} key={address}>
                <PlayerCard
                  address={address}
                  profile={profilesMap.get(address.toLowerCase())}
                  profileLoading={profilesLoading}
                  onClick={handlePlayerClick(address)}
                />
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('player_page.showing_results', {
                  start: String(start),
                  end: String(end),
                  total: String(totalFiltered)
                })}
              </Typography>
              <Pagination count={pageCount} page={page} onChange={handlePageChange} size="small" shape="rounded" />
            </Box>
          )}
        </>
      )}
    </>
  )
}

const PlayerPage = () => {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const track = useStorageTrack()
  const navigate = useNavigate()
  const { data: players, isLoading: playersLoading } = useListPlayersQuery({ wallet, isSignedIn, realm, position }, { skip: !wallet })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [clearAllPlayers] = useClearAllPlayersMutation()

  const addDialog = useDialogState()
  const clearAllDialog = useDialogState()

  const handleSelectPlayer = useCallback(
    (address: string) => {
      navigate(`/players/${address}${window.location.search}`)
    },
    [navigate]
  )

  const handleSaveValue = useCallback(
    async (address: string, key: string, value: unknown) => {
      try {
        await setPlayerValue({ wallet, isSignedIn, realm, position, address, key, value }).unwrap()
        track(StorageEvent.PLAYER_SET_SUCCESS)
      } catch {
        track(StorageEvent.PLAYER_SET_FAILURE)
      }
    },
    [setPlayerValue, wallet, isSignedIn, realm, position, track]
  )

  const handleConfirmClearAll = useCallback(async () => {
    try {
      await clearAllPlayers({ wallet, isSignedIn, realm, position }).unwrap()
      track(StorageEvent.PLAYER_CLEAR_ALL_SUCCESS)
    } catch {
      track(StorageEvent.PLAYER_CLEAR_ALL_FAILURE)
    }
    clearAllDialog.handleClose()
  }, [clearAllPlayers, wallet, isSignedIn, realm, position, clearAllDialog, track])

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('player_page.title')}</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addDialog.handleOpen} sx={{ mr: 1 }}>
            {t('player_page.add')}
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearAllDialog.handleOpen}>
            {t('player_page.clear_all_players')}
          </Button>
        </Box>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('player_page.description')}
      </Typography>

      {playersLoading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress aria-label={t('player_page.loading_players')} />
        </Box>
      ) : (
        <PlayerListView players={players ?? []} onSelectPlayer={handleSelectPlayer} />
      )}

      <AddValueDialog open={addDialog.isOpen} onClose={addDialog.handleClose} onSave={handleSaveValue} />

      <ConfirmDialog
        open={clearAllDialog.isOpen}
        title={t('player_page.clear_all_dialog.title')}
        message={t('player_page.clear_all_dialog.message')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmClearAll}
        onCancel={clearAllDialog.handleClose}
      />
    </Box>
  )
}

export { PlayerPage }
