import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Pagination,
  TextField,
  Typography
} from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { SearchField } from '@/components/SearchField'
import { usePaginatedSearch } from '@/features/assets'
import { useAuth } from '@/features/auth'
import { usePlayerProfiles } from '../hooks'
import { useClearAllPlayersMutation, useListPlayersQuery, useSetPlayerValueMutation } from '../player.client'
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
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: players, isLoading: playersLoading } = useListPlayersQuery({ wallet, isSignedIn }, { skip: !wallet })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [clearAllPlayers] = useClearAllPlayersMutation()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)

  const [newAddress, setNewAddress] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleSelectPlayer = useCallback(
    (address: string) => {
      navigate(`/players/${address}${window.location.search}`)
    },
    [navigate]
  )

  const handleOpenAddDialog = useCallback(() => {
    setNewAddress('')
    setNewKey('')
    setNewValue('')
    setIsAddDialogOpen(true)
  }, [])

  const handleCloseAddDialog = useCallback(() => {
    setIsAddDialogOpen(false)
  }, [])

  const handleSaveValue = useCallback(async () => {
    if (newAddress.trim() && newKey.trim() && newValue.trim()) {
      try {
        const parsedValue = JSON.parse(newValue.trim())
        await setPlayerValue({ wallet, isSignedIn, address: newAddress.trim(), key: newKey.trim(), value: parsedValue })
        setIsAddDialogOpen(false)
      } catch {
        // Invalid JSON
      }
    }
  }, [newAddress, newKey, newValue, setPlayerValue, wallet, isSignedIn])

  const handleOpenClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(true)
  }, [])

  const handleCloseClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(false)
  }, [])

  const handleConfirmClearAll = useCallback(async () => {
    await clearAllPlayers({ wallet, isSignedIn })
    setIsClearAllDialogOpen(false)
  }, [clearAllPlayers, wallet, isSignedIn])

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('player_page.title')}</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
            {t('player_page.add')}
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearAllDialog}>
            {t('player_page.clear_all_players')}
          </Button>
        </Box>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('player_page.description')}
      </Typography>

      {/* Player list */}
      {playersLoading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress aria-label={t('player_page.loading_players')} />
        </Box>
      ) : (
        <PlayerListView players={players ?? []} onSelectPlayer={handleSelectPlayer} />
      )}

      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('player_page.add_dialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="player-address"
            label={t('player_page.add_dialog.address_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t('player_page.address_placeholder')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="player-key"
            label={t('player_page.add_dialog.key_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="player-value"
            label={t('player_page.add_dialog.value_label')}
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder={t('player_page.add_dialog.value_placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveValue} variant="contained" disabled={!newAddress.trim() || !newKey.trim() || !newValue.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isClearAllDialogOpen} onClose={handleCloseClearAllDialog}>
        <DialogTitle>{t('player_page.clear_all_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('player_page.clear_all_dialog.message')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearAllDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmClearAll} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { PlayerPage }
