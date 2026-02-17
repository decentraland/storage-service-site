import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import EditIcon from '@mui/icons-material/Edit'
import {
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
import { useClearEnvMutation, useDeleteEnvMutation, useListEnvKeysQuery, useSetEnvMutation } from '../env.client'

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
  const [setEnv, { isLoading }] = useSetEnvMutation()
  const [editValue, setEditValue] = useState('')

  const handleSave = useCallback(async () => {
    if (!editValue.trim()) return
    await setEnv({ wallet, isSignedIn, realm, position, key: keyName, value: editValue.trim() })
    onClose()
  }, [editValue, keyName, setEnv, wallet, isSignedIn, realm, position, onClose])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('env_page.edit_dialog.title')}</DialogTitle>
      <DialogContent>
        <>
          <TextField
            margin="dense"
            label={t('env_page.edit_dialog.key_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={keyName}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            autoFocus
            margin="dense"
            label={t('env_page.edit_dialog.value_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
          />
        </>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || !editValue.trim()}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const EnvPage = () => {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  const { wallet, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const { data: envKeys, isLoading } = useListEnvKeysQuery({ wallet, isSignedIn, realm, position }, { skip: !wallet })
  const [setEnv] = useSetEnvMutation()
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()

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

  const handleSaveEnv = useCallback(async () => {
    if (!newKey.trim() || !newValue.trim()) return
    await setEnv({ wallet, isSignedIn, realm, position, key: newKey.trim(), value: newValue.trim() })
    addDialog.handleClose()
  }, [newKey, newValue, setEnv, wallet, isSignedIn, realm, position, addDialog])

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
    await deleteEnv({ wallet, isSignedIn, realm, position, key: selectedKey })
    handleCloseDeleteDialog()
  }, [selectedKey, deleteEnv, wallet, isSignedIn, realm, position, handleCloseDeleteDialog])

  const handleConfirmClear = useCallback(async () => {
    await clearEnv({ wallet, isSignedIn, realm, position })
    clearDialog.handleClose()
  }, [clearEnv, wallet, isSignedIn, realm, position, clearDialog])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  const hasEnvKeys = envKeys && envKeys.length > 0

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('env_page.title')}</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
            {t('env_page.add')}
          </Button>
          {hasEnvKeys && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearDialog.handleOpen}>
              {t('env_page.clear_all')}
            </Button>
          )}
        </Box>
      </Box>

      {hasEnvKeys ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.key')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envKeys.map(env => (
                <TableRow key={env.key}>
                  <TableCell>{env.key}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`edit ${env.key}`} color="primary" onClick={() => handleOpenEditDialog(env.key)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label={`delete ${env.key}`} color="error" onClick={() => handleOpenDeleteDialog(env.key)}>
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
          <Typography color="text.secondary">{t('env_page.no_keys')}</Typography>
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

      <Dialog open={addDialog.isOpen} onClose={addDialog.handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('env_page.add_dialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="env-key"
            label={t('env_page.add_dialog.key_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="env-value"
            label={t('env_page.add_dialog.value_label')}
            type="text"
            fullWidth
            variant="outlined"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={addDialog.handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveEnv} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('env_page.delete_dialog.title')}
        message={t('env_page.delete_dialog.message', { key: selectedKey ?? '' })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />

      <ConfirmDialog
        open={clearDialog.isOpen}
        title={t('env_page.clear_dialog.title')}
        message={t('env_page.clear_dialog.message')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmClear}
        onCancel={clearDialog.handleClose}
      />
    </Box>
  )
}

export { EnvPage }
