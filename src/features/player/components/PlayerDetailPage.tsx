import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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
import { Profile } from 'decentraland-ui2'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/features/auth'
import { useDialogState } from '@/hooks'
import { usePlayerProfiles } from '../hooks'
import {
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useSetPlayerValueMutation
} from '../player.client'
import { AddValueDialog } from './AddValueDialog'

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
    if (!editValue.trim()) return
    try {
      const parsedValue = JSON.parse(editValue.trim())
      await setPlayerValue({ wallet, isSignedIn, address, key: keyName, value: parsedValue })
      onClose()
    } catch {
      setJsonError(t('player_page.edit_dialog.json_error'))
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

interface PlayerDetailPageProps {
  address: string
}

const PlayerDetailPage = ({ address }: PlayerDetailPageProps) => {
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { profilesMap } = usePlayerProfiles([address])
  const profile = profilesMap.get(address.toLowerCase())

  const { data: playerKeys, isLoading: keysLoading } = useListPlayerKeysQuery({ wallet, isSignedIn, address })
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [deletePlayerValue] = useDeletePlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()

  const addDialog = useDialogState()
  const deleteDialog = useDialogState()
  const clearPlayerDialog = useDialogState()
  const editDialog = useDialogState()

  const [selectedKey, setSelectedKey] = useState<string>('')

  const handleBack = useCallback(() => {
    navigate(`/players${window.location.search}`)
  }, [navigate])

  const handleSaveValue = useCallback(
    async (addr: string, key: string, value: unknown) => {
      await setPlayerValue({ wallet, isSignedIn, address: addr, key, value })
    },
    [setPlayerValue, wallet, isSignedIn]
  )

  const handleOpenEditDialog = useCallback(
    (key: string) => {
      setSelectedKey(key)
      editDialog.handleOpen()
    },
    [editDialog]
  )

  const handleCloseEditDialog = useCallback(() => {
    editDialog.handleClose()
    setSelectedKey('')
  }, [editDialog])

  const handleOpenDeleteDialog = useCallback(
    (key: string) => {
      setSelectedKey(key)
      deleteDialog.handleOpen()
    },
    [deleteDialog]
  )

  const handleCloseDeleteDialog = useCallback(() => {
    deleteDialog.handleClose()
    setSelectedKey('')
  }, [deleteDialog])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedKey) return
    await deletePlayerValue({ wallet, isSignedIn, address, key: selectedKey })
    handleCloseDeleteDialog()
  }, [selectedKey, deletePlayerValue, wallet, isSignedIn, address, handleCloseDeleteDialog])

  const handleConfirmClearPlayer = useCallback(async () => {
    await clearPlayer({ wallet, isSignedIn, address })
    clearPlayerDialog.handleClose()
    navigate(`/players${window.location.search}`)
  }, [clearPlayer, wallet, isSignedIn, address, clearPlayerDialog, navigate])

  return (
    <Box p={3}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('player_page.title')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          {t('player_page.back_to_players')}
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Profile
            address={address}
            avatar={profile?.avatar}
            showBothNameAndAddress
            shortenAddress
            showCopyButton
            highlightName
            size="huge"
          />

          <Box display="flex" gap={1}>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addDialog.handleOpen}>
              {t('player_page.add')}
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={clearPlayerDialog.handleOpen}
              aria-label={`clear storage for ${address}`}
            >
              {t('player_page.clear_this_player')}
            </Button>
          </Box>
        </Box>
      </Box>

      {keysLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress aria-label={t('player_page.loading_keys')} />
        </Box>
      ) : !playerKeys || playerKeys.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('player_page.no_keys')}</Typography>
        </Paper>
      ) : (
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
                    <IconButton aria-label={`edit ${item.key}`} color="primary" onClick={() => handleOpenEditDialog(item.key)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label={`delete ${item.key}`} color="error" onClick={() => handleOpenDeleteDialog(item.key)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedKey && (
        <EditDialog
          address={address}
          keyName={selectedKey}
          open={editDialog.isOpen}
          onClose={handleCloseEditDialog}
          wallet={wallet}
          isSignedIn={isSignedIn}
        />
      )}

      <AddValueDialog open={addDialog.isOpen} onClose={addDialog.handleClose} onSave={handleSaveValue} address={address} />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('player_page.delete_dialog.title')}
        message={t('player_page.delete_dialog.message', { key: selectedKey, address })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />

      <ConfirmDialog
        open={clearPlayerDialog.isOpen}
        title={t('player_page.clear_player_dialog.title')}
        message={t('player_page.clear_player_dialog.message', { address })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmClearPlayer}
        onCancel={clearPlayerDialog.handleClose}
      />
    </Box>
  )
}

export { PlayerDetailPage }
