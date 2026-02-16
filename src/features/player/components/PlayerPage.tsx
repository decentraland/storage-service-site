import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { useAuth } from '@/features/auth'
import {
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useSetPlayerValueMutation
} from '../player.client'

interface EditDialogProps {
  address: string
  keyName: string
  open: boolean
  onClose: () => void
  wallet?: string
  isSignedIn?: boolean
}

const EditDialog = ({ address, keyName, open, onClose, wallet, isSignedIn }: EditDialogProps) => {
  const { t } = useTranslation()
  const { data, isLoading } = useGetPlayerValueQuery({ wallet, isSignedIn, address, key: keyName }, { skip: !open || !keyName || !address })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [editValue, setEditValue] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  useEffect(() => {
    if (data?.value !== undefined) {
      setEditValue(JSON.stringify(data.value, null, 2))
      setJsonError(null)
    }
  }, [data?.value])

  const handleValueChange = useCallback(
    (value: string) => {
      setEditValue(value)
      try {
        JSON.parse(value)
        setJsonError(null)
      } catch {
        setJsonError(t('player_page.edit_dialog.json_error'))
      }
    },
    [t]
  )

  const handleSave = useCallback(async () => {
    if (editValue.trim()) {
      try {
        const parsedValue = JSON.parse(editValue.trim())
        await setPlayerValue({ wallet, isSignedIn, address, key: keyName, value: parsedValue })
        onClose()
      } catch {
        setJsonError(t('player_page.edit_dialog.json_error'))
      }
    }
  }, [editValue, address, keyName, setPlayerValue, wallet, isSignedIn, onClose, t])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('player_page.edit_dialog.title', { key: keyName })}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('player_page.edit_dialog.subtitle', { address })}
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              autoFocus
              margin="dense"
              label={t('player_page.edit_dialog.value_label')}
              fullWidth
              variant="outlined"
              multiline
              rows={12}
              value={editValue}
              onChange={e => handleValueChange(e.target.value)}
              error={!!jsonError}
              sx={{ fontFamily: 'monospace' }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
            />
            {jsonError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {jsonError}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !!jsonError || !editValue.trim()}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const PlayerPage = () => {
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [deletePlayerValue] = useDeletePlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()
  const [clearAllPlayers] = useClearAllPlayersMutation()

  // Player address entered by user (OpenAPI has no GET /players; user enters address to load keys)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearPlayerDialogOpen, setIsClearPlayerDialogOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [selectedKey, setSelectedKey] = useState<string>('')

  // Form state
  const [newAddress, setNewAddress] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

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
        await setPlayerValue({
          wallet,
          isSignedIn,
          address: newAddress.trim(),
          key: newKey.trim(),
          value: parsedValue
        })
        setIsAddDialogOpen(false)
      } catch {
        // Invalid JSON - could show error to user
      }
    }
  }, [newAddress, newKey, newValue, setPlayerValue, wallet, isSignedIn])

  const handleOpenEditDialog = useCallback((address: string, key: string) => {
    setSelectedAddress(address)
    setSelectedKey(key)
    setIsEditDialogOpen(true)
  }, [])

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedAddress('')
    setSelectedKey('')
  }, [])

  const handleOpenDeleteDialog = useCallback((address: string, key: string) => {
    setSelectedAddress(address)
    setSelectedKey(key)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setSelectedAddress('')
    setSelectedKey('')
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (selectedAddress && selectedKey) {
      await deletePlayerValue({ wallet, isSignedIn, address: selectedAddress, key: selectedKey })
      setIsDeleteDialogOpen(false)
      setSelectedAddress('')
      setSelectedKey('')
    }
  }, [selectedAddress, selectedKey, deletePlayerValue, wallet, isSignedIn])

  const handleOpenClearPlayerDialog = useCallback((address: string) => {
    setSelectedAddress(address)
    setIsClearPlayerDialogOpen(true)
  }, [])

  const handleCloseClearPlayerDialog = useCallback(() => {
    setIsClearPlayerDialogOpen(false)
    setSelectedAddress('')
  }, [])

  const handleConfirmClearPlayer = useCallback(async () => {
    if (selectedAddress) {
      await clearPlayer({ wallet, isSignedIn, address: selectedAddress })
      setIsClearPlayerDialogOpen(false)
      setSelectedAddress('')
      setSelectedPlayer(null)
    }
  }, [selectedAddress, clearPlayer, wallet, isSignedIn])

  const handleOpenClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(true)
  }, [])

  const handleCloseClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(false)
  }, [])

  const handleConfirmClearAll = useCallback(async () => {
    await clearAllPlayers({ wallet, isSignedIn })
    setIsClearAllDialogOpen(false)
    setSelectedPlayer(null)
  }, [clearAllPlayers, wallet, isSignedIn])

  const handleLoadAddress = useCallback(() => {
    const address = addressInput.trim()
    if (address) {
      setSelectedPlayer(address)
    }
  }, [addressInput])

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

      <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          label={t('player_page.address_label')}
          placeholder={t('player_page.address_placeholder')}
          value={addressInput}
          onChange={e => setAddressInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLoadAddress()}
          variant="outlined"
          size="small"
          sx={{ minWidth: 400 }}
          inputProps={{ 'aria-label': t('player_page.address_label') }}
        />
        <Button variant="contained" onClick={handleLoadAddress} disabled={!addressInput.trim()}>
          {t('player_page.load_keys')}
        </Button>
      </Box>

      {selectedPlayer && wallet && (
        <PlayerKeysSection
          address={selectedPlayer}
          wallet={wallet}
          isSignedIn={isSignedIn}
          onEdit={handleOpenEditDialog}
          onDelete={handleOpenDeleteDialog}
          onClearPlayer={handleOpenClearPlayerDialog}
        />
      )}

      {/* Edit Dialog */}
      {selectedAddress && selectedKey && (
        <EditDialog
          address={selectedAddress}
          keyName={selectedKey}
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          wallet={wallet}
          isSignedIn={isSignedIn}
        />
      )}

      {/* Add Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t('player_page.delete_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('player_page.delete_dialog.message', { key: selectedKey, address: selectedAddress })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Player Confirmation Dialog */}
      <Dialog open={isClearPlayerDialogOpen} onClose={handleCloseClearPlayerDialog}>
        <DialogTitle>{t('player_page.clear_player_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('player_page.clear_player_dialog.message', { address: selectedAddress })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearPlayerDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmClearPlayer} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Players Confirmation Dialog */}
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

interface PlayerKeysSectionProps {
  address: string
  wallet?: string
  isSignedIn?: boolean
  onEdit: (address: string, key: string) => void
  onDelete: (address: string, key: string) => void
  onClearPlayer: (address: string) => void
}

const PlayerKeysSection = ({ address, wallet, isSignedIn, onEdit, onDelete, onClearPlayer }: PlayerKeysSectionProps) => {
  const { t } = useTranslation()
  const { data: playerKeys, isLoading } = useListPlayerKeysQuery({ wallet, isSignedIn, address })

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress aria-label={t('player_page.loading_keys')} />
      </Box>
    )
  }

  if (!playerKeys || playerKeys.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{t('player_page.no_keys')}</Typography>
      </Paper>
    )
  }

  return (
    <Box mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{t('player_page.keys_for', { address })}</Typography>
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={() => onClearPlayer(address)}
          aria-label={`clear storage for ${address}`}
        >
          {t('player_page.clear_this_player')}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.key')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerKeys.map(item => (
              <TableRow key={item.key}>
                <TableCell>{item.key}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label={`edit ${item.key}`} color="primary" onClick={() => onEdit(address, item.key)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label={`delete ${item.key}`} color="error" onClick={() => onDelete(address, item.key)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export { PlayerPage }
