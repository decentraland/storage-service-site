import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VisibilityIcon from '@mui/icons-material/Visibility'
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
import {
  useClearSceneMutation,
  useDeleteSceneValueMutation,
  useGetSceneValueQuery,
  useListSceneKeysQuery,
  useSetSceneValueMutation
} from '../scene.client'

interface ViewDialogProps {
  keyName: string
  open: boolean
  onClose: () => void
}

const ViewDialog = ({ keyName, open, onClose }: ViewDialogProps) => {
  const { data, isLoading } = useGetSceneValueQuery({ key: keyName }, { skip: !open || !keyName })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>View Value: {keyName}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ p: 2, bgcolor: 'grey.900', overflow: 'auto', maxHeight: '400px' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(data?.value, null, 2)}</pre>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

const ScenePage = () => {
  const { data: sceneKeys, isLoading, refetch } = useListSceneKeysQuery()
  const [setSceneValue] = useSetSceneValueMutation()
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
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
        await setSceneValue({ key: newKey.trim(), value: parsedValue })
        setIsAddDialogOpen(false)
        refetch()
      } catch {
        // Invalid JSON - could show error to user
      }
    }
  }, [newKey, newValue, setSceneValue, refetch])

  const handleOpenViewDialog = useCallback((key: string) => {
    setSelectedKey(key)
    setIsViewDialogOpen(true)
  }, [])

  const handleCloseViewDialog = useCallback(() => {
    setIsViewDialogOpen(false)
    setSelectedKey(null)
  }, [])

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
      await deleteSceneValue({ key: selectedKey })
      setIsDeleteDialogOpen(false)
      setSelectedKey(null)
      refetch()
    }
  }, [selectedKey, deleteSceneValue, refetch])

  const handleOpenClearDialog = useCallback(() => {
    setIsClearDialogOpen(true)
  }, [])

  const handleCloseClearDialog = useCallback(() => {
    setIsClearDialogOpen(false)
  }, [])

  const handleConfirmClear = useCallback(async () => {
    await clearScene()
    setIsClearDialogOpen(false)
    refetch()
  }, [clearScene, refetch])

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
        <Typography variant="h4">Scene Storage</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
            Add
          </Button>
          {hasSceneKeys && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearDialog}>
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      {hasSceneKeys ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sceneKeys.map(item => (
                <TableRow key={item.key}>
                  <TableCell>{item.key}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`view ${item.key}`} color="primary" onClick={() => handleOpenViewDialog(item.key)}>
                      <VisibilityIcon />
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
          <Typography color="text.secondary">No scene values found</Typography>
        </Paper>
      )}

      {/* View Dialog */}
      <ViewDialog keyName={selectedKey ?? ''} open={isViewDialogOpen} onClose={handleCloseViewDialog} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Scene Value</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="scene-key"
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
            id="scene-value"
            label="Value (JSON)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleSaveValue} variant="contained" disabled={!newKey.trim() || !newValue.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Scene Value</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the scene value &quot;{selectedKey}&quot;? This action cannot be undone.
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
        <DialogTitle>Clear All Scene Values</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete ALL scene values? This action cannot be undone.</DialogContentText>
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

export { ScenePage }
