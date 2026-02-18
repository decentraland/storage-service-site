import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StorageValueField, type StorageValueFieldRef } from '@/components/StorageValueField'
import { useAuth } from '@/features/auth'
import { useDialogState } from '@/hooks'
import { StorageEvent, useStorageTrack } from '@/lib/analytics'
import {
  useClearSceneMutation,
  useDeleteSceneValueMutation,
  useGetSceneValueQuery,
  useListSceneKeysQuery,
  useSetSceneValueMutation
} from '../scene.client'

interface EditDialogProps {
  keyName: string
  open: boolean
  onClose: () => void
  wallet?: string
  isSignedIn?: boolean
  realm?: string | null
  position?: string | null
}

const EditDialog = ({ keyName, open, onClose, wallet, isSignedIn, realm, position }: EditDialogProps) => {
  const { t } = useTranslation()
  const track = useStorageTrack()
  const { data, isLoading } = useGetSceneValueQuery({ wallet, isSignedIn, key: keyName, realm, position }, { skip: !open || !keyName })
  const [setSceneValue] = useSetSceneValueMutation()
  const fieldRef = useRef<StorageValueFieldRef>(null)
  const [isValid, setIsValid] = useState(false)

  const handleSave = useCallback(async () => {
    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return

    try {
      await setSceneValue({ wallet, isSignedIn, realm, position, key: keyName, value: parsedValue }).unwrap()
      track(StorageEvent.SCENE_SET_SUCCESS)
      onClose()
    } catch {
      track(StorageEvent.SCENE_SET_FAILURE)
    }
  }, [keyName, setSceneValue, wallet, isSignedIn, realm, position, onClose, track])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('scene_page.edit_dialog.title', { key: keyName })}</DialogTitle>
      <DialogContent>
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
            label={t('scene_page.edit_dialog.value_label')}
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

interface AddSceneValueDialogProps {
  open: boolean
  onClose: () => void
  wallet?: string
  isSignedIn?: boolean
  realm?: string | null
  position?: string | null
}

const AddSceneValueDialog = ({ open, onClose, wallet, isSignedIn, realm, position }: AddSceneValueDialogProps) => {
  const { t } = useTranslation()
  const track = useStorageTrack()
  const [setSceneValue] = useSetSceneValueMutation()
  const [newKey, setNewKey] = useState('')
  const [isValueValid, setIsValueValid] = useState(false)
  const fieldRef = useRef<StorageValueFieldRef>(null)

  useEffect(() => {
    if (open) {
      setNewKey('')
      setIsValueValid(false)
      fieldRef.current?.reset()
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!newKey.trim()) return

    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return

    try {
      await setSceneValue({ wallet, isSignedIn, realm, position, key: newKey.trim(), value: parsedValue }).unwrap()
      track(StorageEvent.SCENE_SET_SUCCESS)
      onClose()
    } catch {
      track(StorageEvent.SCENE_SET_FAILURE)
    }
  }, [newKey, setSceneValue, wallet, isSignedIn, realm, position, onClose, track])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('scene_page.add_dialog.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="scene-key"
          label={t('scene_page.add_dialog.key_label')}
          type="text"
          fullWidth
          variant="outlined"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          sx={{ mb: 2 }}
        />
        <StorageValueField
          ref={fieldRef}
          onChange={e => setIsValueValid(e.isValid)}
          margin="dense"
          id="scene-value"
          label={t('scene_page.add_dialog.value_label')}
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          placeholder={t('scene_page.add_dialog.value_placeholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={!newKey.trim() || !isValueValid}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ScenePage = () => {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const track = useStorageTrack()
  const { data: sceneKeys, isLoading } = useListSceneKeysQuery({ wallet, isSignedIn, realm, position }, { skip: !wallet })
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

  const addDialog = useDialogState()
  const editDialog = useDialogState()
  const deleteDialog = useDialogState()
  const clearDialog = useDialogState()

  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const handleOpenEditDialog = useCallback(
    (key: string) => {
      setSelectedKey(key)
      editDialog.handleOpen()
    },
    [editDialog]
  )

  const handleCloseEditDialog = useCallback(() => {
    editDialog.handleClose()
    setSelectedKey(null)
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
    setSelectedKey(null)
  }, [deleteDialog])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedKey) return
    try {
      await deleteSceneValue({ wallet, isSignedIn, realm, position, key: selectedKey }).unwrap()
      track(StorageEvent.SCENE_DELETE_SUCCESS)
    } catch {
      track(StorageEvent.SCENE_DELETE_FAILURE)
    }
    handleCloseDeleteDialog()
  }, [selectedKey, deleteSceneValue, wallet, isSignedIn, realm, position, handleCloseDeleteDialog, track])

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearScene({ wallet, isSignedIn, realm, position }).unwrap()
      track(StorageEvent.SCENE_CLEAR_SUCCESS)
    } catch {
      track(StorageEvent.SCENE_CLEAR_FAILURE)
    }
    clearDialog.handleClose()
  }, [clearScene, wallet, isSignedIn, realm, position, clearDialog, track])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  const hasSceneKeys = sceneKeys && sceneKeys.length > 0

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('scene_page.title')}</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addDialog.handleOpen} sx={{ mr: 1 }}>
            {t('scene_page.add')}
          </Button>
          {hasSceneKeys && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearDialog.handleOpen}>
              {t('scene_page.clear_all')}
            </Button>
          )}
        </Box>
      </Box>

      {hasSceneKeys ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.key')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sceneKeys.map(item => (
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
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('scene_page.no_keys')}</Typography>
        </Paper>
      )}

      {selectedKey && (
        <EditDialog
          keyName={selectedKey}
          open={editDialog.isOpen}
          onClose={handleCloseEditDialog}
          wallet={wallet}
          isSignedIn={isSignedIn}
          realm={realm}
          position={position}
        />
      )}

      <AddSceneValueDialog
        open={addDialog.isOpen}
        onClose={addDialog.handleClose}
        wallet={wallet}
        isSignedIn={isSignedIn}
        realm={realm}
        position={position}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('scene_page.delete_dialog.title')}
        message={t('scene_page.delete_dialog.message', { key: selectedKey ?? '' })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />

      <ConfirmDialog
        open={clearDialog.isOpen}
        title={t('scene_page.clear_dialog.title')}
        message={t('scene_page.clear_dialog.message')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmClear}
        onCancel={clearDialog.handleClose}
      />
    </Box>
  )
}

export { ScenePage }
