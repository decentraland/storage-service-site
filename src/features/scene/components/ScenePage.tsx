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
    if (editValue.trim()) {
      try {
        const parsedValue = JSON.parse(editValue.trim())
        await setSceneValue({ wallet, isSignedIn, key: keyName, value: parsedValue })
        onClose()
      } catch {
        setJsonError(t('scene_page.edit_dialog.json_error'))
      }
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
  const { data: sceneKeys, isLoading, refetch } = useListSceneKeysQuery({ wallet, isSignedIn }, { skip: !wallet })
  const [setSceneValue] = useSetSceneValueMutation()
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

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

  const handleSaveValue = useCallback(async () => {
    if (newKey.trim() && newValue.trim()) {
      try {
        const parsedValue = JSON.parse(newValue.trim())
        await setSceneValue({ wallet, isSignedIn, key: newKey.trim(), value: parsedValue })
        setIsAddDialogOpen(false)
        refetch()
      } catch {
        // Invalid JSON - could show error to user
      }
    }
  }, [newKey, newValue, setSceneValue, refetch, wallet, isSignedIn])

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
      await deleteSceneValue({ wallet, isSignedIn, key: selectedKey })
      setIsDeleteDialogOpen(false)
      setSelectedKey(null)
      refetch()
    }
  }, [selectedKey, deleteSceneValue, refetch, wallet, isSignedIn])

  const handleOpenClearDialog = useCallback(() => {
    setIsClearDialogOpen(true)
  }, [])

  const handleCloseClearDialog = useCallback(() => {
    setIsClearDialogOpen(false)
  }, [])

  const handleConfirmClear = useCallback(async () => {
    await clearScene({ wallet, isSignedIn })
    setIsClearDialogOpen(false)
    refetch()
  }, [clearScene, refetch, wallet, isSignedIn])

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
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearDialog}>
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

      {/* Edit Dialog */}
      {selectedKey && (
        <EditDialog keyName={selectedKey} open={isEditDialogOpen} onClose={handleCloseEditDialog} wallet={wallet} isSignedIn={isSignedIn} />
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
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
          <Button onClick={handleCloseAddDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveValue} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t('scene_page.delete_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('scene_page.delete_dialog.message', { key: selectedKey ?? '' })}</DialogContentText>
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
        <DialogTitle>{t('scene_page.clear_dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('scene_page.clear_dialog.message')}</DialogContentText>
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

export { ScenePage }
