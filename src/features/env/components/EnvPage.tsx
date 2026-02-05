import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
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
import { useClearEnvMutation, useDeleteEnvMutation, useListEnvKeysQuery, useSetEnvMutation } from '../env.client'

const EnvPage = () => {
  const { data: envKeys, isLoading, refetch } = useListEnvKeysQuery()
  const [setEnv] = useSetEnvMutation()
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null)

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
      await setEnv({ key: newKey.trim(), value: newValue.trim() })
      setIsAddDialogOpen(false)
      refetch()
    }
  }, [newKey, newValue, setEnv, refetch])

  const handleOpenDeleteDialog = useCallback((key: string) => {
    setKeyToDelete(key)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setKeyToDelete(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (keyToDelete) {
      await deleteEnv({ key: keyToDelete })
      setIsDeleteDialogOpen(false)
      setKeyToDelete(null)
      refetch()
    }
  }, [keyToDelete, deleteEnv, refetch])

  const handleOpenClearDialog = useCallback(() => {
    setIsClearDialogOpen(true)
  }, [])

  const handleCloseClearDialog = useCallback(() => {
    setIsClearDialogOpen(false)
  }, [])

  const handleConfirmClear = useCallback(async () => {
    await clearEnv()
    setIsClearDialogOpen(false)
    refetch()
  }, [clearEnv, refetch])

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
        <Typography variant="h4">Environment Variables</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
            Add
          </Button>
          {hasEnvKeys && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearDialog}>
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      {hasEnvKeys ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envKeys.map(env => (
                <TableRow key={env.key}>
                  <TableCell>{env.key}</TableCell>
                  <TableCell align="right">
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
          <Typography color="text.secondary">No environment variables found</Typography>
        </Paper>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Environment Variable</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="env-key"
            label="Key"
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
            label="Value"
            type="text"
            fullWidth
            variant="outlined"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleSaveEnv} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Environment Variable</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the environment variable &quot;{keyToDelete}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onClose={handleCloseClearDialog}>
        <DialogTitle>Clear All Environment Variables</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete ALL environment variables? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog}>Cancel</Button>
          <Button onClick={handleConfirmClear} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { EnvPage }
