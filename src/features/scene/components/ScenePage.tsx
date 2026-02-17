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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/features/auth'
import { useDialogState } from '@/hooks'
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
}

const EditDialog = ({ keyName, open, onClose, wallet, isSignedIn }: EditDialogProps) => {
  const { t } = useTranslation()
  const { data, isLoading } = useGetSceneValueQuery({ wallet, isSignedIn, key: keyName }, { skip: !open || !keyName })
  const [setSceneValue] = useSetSceneValueMutation()
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
        setJsonError(t('scene_page.edit_dialog.json_error'))
      }
    },
    [t]
  )

  const handleSave = useCallback(async () => {
    if (!editValue.trim()) return
    try {
      const parsedValue = JSON.parse(editValue.trim())
      await setSceneValue({ wallet, isSignedIn, key: keyName, value: parsedValue })
      onClose()
    } catch {
      setJsonError(t('scene_page.edit_dialog.json_error'))
    }
  }, [editValue, keyName, setSceneValue, wallet, isSignedIn, onClose, t])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('scene_page.edit_dialog.title', { key: keyName })}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              autoFocus
              margin="dense"
              label={t('scene_page.edit_dialog.value_label')}
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

const ScenePage = () => {
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const { data: sceneKeys, isLoading } = useListSceneKeysQuery({ wallet, isSignedIn }, { skip: !wallet })
  const [setSceneValue] = useSetSceneValueMutation()
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

  const addDialog = useDialogState()
  const editDialog = useDialogState()
  const deleteDialog = useDialogState()
  const clearDialog = useDialogState()

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleOpenAddDialog = useCallback(() => {
    setNewKey('')
    setNewValue('')
    addDialog.handleOpen()
  }, [addDialog])

  const handleSaveValue = useCallback(async () => {
    if (!newKey.trim() || !newValue.trim()) return
    try {
      const parsedValue = JSON.parse(newValue.trim())
      await setSceneValue({ wallet, isSignedIn, key: newKey.trim(), value: parsedValue })
      addDialog.handleClose()
    } catch {
      // Invalid JSON
    }
  }, [newKey, newValue, setSceneValue, wallet, isSignedIn, addDialog])

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
    await deleteSceneValue({ wallet, isSignedIn, key: selectedKey })
    handleCloseDeleteDialog()
  }, [selectedKey, deleteSceneValue, wallet, isSignedIn, handleCloseDeleteDialog])

  const handleConfirmClear = useCallback(async () => {
    await clearScene({ wallet, isSignedIn })
    clearDialog.handleClose()
  }, [clearScene, wallet, isSignedIn, clearDialog])

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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
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
        />
      )}

      <Dialog open={addDialog.isOpen} onClose={addDialog.handleClose} maxWidth="sm" fullWidth>
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
          <TextField
            margin="dense"
            id="scene-value"
            label={t('scene_page.add_dialog.value_label')}
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder={t('scene_page.add_dialog.value_placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={addDialog.handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveValue} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

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
