import { useCallback, useEffect, useState } from 'react'
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
import { useClearEnvMutation, useDeleteEnvMutation, useGetEnvValueQuery, useListEnvKeysQuery, useSetEnvMutation } from '../env.client'

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
  const { data, isLoading } = useGetEnvValueQuery({ wallet, isSignedIn, realm, position, key: keyName }, { skip: !open || !keyName })
  const [setEnv] = useSetEnvMutation()
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (data?.value !== undefined) {
      setEditValue(data.value)
    }
  }, [data?.value])

  const handleSave = useCallback(async () => {
    if (editValue.trim()) {
      await setEnv({ wallet, isSignedIn, realm, position, key: keyName, value: editValue.trim() })
      onClose()
    }
  }, [editValue, keyName, setEnv, wallet, isSignedIn, realm, position, onClose])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('env_page.edit_dialog.title')}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
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
        )}
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
  const { data: envKeys, isLoading, refetch } = useListEnvKeysQuery({ wallet, isSignedIn, realm, position }, { skip: !wallet })
  const [setEnv] = useSetEnvMutation()
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Form state
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleOpenAddDialog = useCallback(() => {
    setNewKey('')
    setNewValue('')
    setIsAddDialogOpen(true)
  }, [])

  const handleCloseAddDialog = useCallback(() => {
    setIsAddDialogOpen(false)
  }, [])

  const handleSaveEnv = useCallback(async () => {
    if (newKey.trim() && newValue.trim()) {
      await setEnv({ wallet, isSignedIn, realm, position, key: newKey.trim(), value: newValue.trim() })
      setIsAddDialogOpen(false)
      refetch()
    }
  }, [newKey, newValue, setEnv, refetch, wallet, isSignedIn, realm, position])

  const handleOpenEditDialog = useCallback((key: string) => {
    setSelectedKey(key)
    setIsEditDialogOpen(true)
  }, [])

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedKey(null)
    refetch()
  }, [refetch])

  const handleOpenDeleteDialog = useCallback((key: string) => {
    setSelectedKey(key)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setSelectedKey(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (selectedKey) {
      await deleteEnv({ wallet, isSignedIn, realm, position, key: selectedKey })
      setIsDeleteDialogOpen(false)
      setSelectedKey(null)
      refetch()
    }
  }, [selectedKey, deleteEnv, refetch, wallet, isSignedIn, realm, position])

  const handleOpenClearDialog = useCallback(() => {
    setIsClearDialogOpen(true)
  }, [])

  const handleCloseClearDialog = useCallback(() => {
    setIsClearDialogOpen(false)
  }, [])

  const handleConfirmClear = useCallback(async () => {
    await clearEnv({ wallet, isSignedIn, realm, position })
    setIsClearDialogOpen(false)
    refetch()
  }, [clearEnv, refetch, wallet, isSignedIn, realm, position])

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
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearDialog}>
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

      {/* Edit Dialog */}
      {selectedKey && (
        <EditDialog
          keyName={selectedKey}
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          wallet={wallet}
          isSignedIn={isSignedIn}
          realm={realm}
          position={position}
        />
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
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
          <Button onClick={handleCloseAddDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveEnv} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t('env_page.delete_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('env_page.delete_dialog.message', { key: selectedKey ?? '' })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onClose={handleCloseClearDialog}>
        <DialogTitle>{t('env_page.clear_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('env_page.clear_dialog.message')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmClear} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { EnvPage }
