import { useCallback, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'
import { Profile } from 'decentraland-ui2'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StorageValueField, type StorageValueFieldRef } from '@/components/StorageValueField'
import { useAuth } from '@/features/auth'
import { useDialogState } from '@/hooks'
import { StorageEvent, useStorageTrack } from '@/lib/analytics'
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
  realm?: string | null
  position?: string | null
}

const EditDialog = ({ address, keyName, open, onClose, wallet, isSignedIn, realm, position }: EditDialogProps) => {
  const { t } = useTranslation()
  const track = useStorageTrack()
  const { data, isLoading } = useGetPlayerValueQuery(
    { wallet, isSignedIn, address, key: keyName, realm, position },
    { skip: !open || !keyName || !address }
  )
  const [setPlayerValue] = useSetPlayerValueMutation()
  const fieldRef = useRef<StorageValueFieldRef>(null)
  const [isValid, setIsValid] = useState(false)

  const handleSave = useCallback(async () => {
    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return

    try {
      await setPlayerValue({ wallet, isSignedIn, realm, position, address, key: keyName, value: parsedValue }).unwrap()
      track(StorageEvent.PLAYER_SET_SUCCESS)
      onClose()
    } catch {
      track(StorageEvent.PLAYER_SET_FAILURE)
    }
  }, [address, keyName, setPlayerValue, wallet, isSignedIn, realm, position, onClose, track])

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
          <StorageValueField
            ref={fieldRef}
            defaultValue={data?.value}
            onChange={e => setIsValid(e.isValid)}
            autoFocus
            margin="dense"
            label={t('player_page.edit_dialog.value_label')}
            fullWidth
            variant="outlined"
            multiline
            rows={12}
            sx={{ fontFamily: 'monospace' }}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !isValid}>
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
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const track = useStorageTrack()
  const navigate = useNavigate()

  const { profilesMap } = usePlayerProfiles([address])
  const profile = profilesMap.get(address.toLowerCase())

  const { data: playerKeys, isLoading: keysLoading } = useListPlayerKeysQuery(
    { wallet, isSignedIn, address, realm, position },
    { skip: !wallet }
  )
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
      try {
        await setPlayerValue({ wallet, isSignedIn, realm, position, address: addr, key, value }).unwrap()
        track(StorageEvent.PLAYER_SET_SUCCESS)
      } catch {
        track(StorageEvent.PLAYER_SET_FAILURE)
      }
    },
    [setPlayerValue, wallet, isSignedIn, realm, position, track]
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
    try {
      await deletePlayerValue({ wallet, isSignedIn, realm, position, address, key: selectedKey }).unwrap()
      track(StorageEvent.PLAYER_DELETE_SUCCESS)
    } catch {
      track(StorageEvent.PLAYER_DELETE_FAILURE)
    }
    handleCloseDeleteDialog()
  }, [selectedKey, deletePlayerValue, wallet, isSignedIn, realm, position, address, handleCloseDeleteDialog, track])

  const handleConfirmClearPlayer = useCallback(async () => {
    try {
      await clearPlayer({ wallet, isSignedIn, realm, position, address }).unwrap()
      track(StorageEvent.PLAYER_CLEAR_SUCCESS)
      clearPlayerDialog.handleClose()
      navigate(`/players${window.location.search}`)
    } catch {
      track(StorageEvent.PLAYER_CLEAR_FAILURE)
    }
  }, [clearPlayer, wallet, isSignedIn, realm, position, address, clearPlayerDialog, navigate, track])

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
          realm={realm}
          position={position}
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
