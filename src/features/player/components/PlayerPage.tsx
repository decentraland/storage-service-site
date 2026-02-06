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
  useClearAllPlayersMutation,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useGetPlayerValueQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useSetPlayerValueMutation
} from '../player.client'

interface ViewDialogProps {
  address: string
  keyName: string
  open: boolean
  onClose: () => void
}

const ViewDialog = ({ address, keyName, open, onClose }: ViewDialogProps) => {
  const { data, isLoading } = useGetPlayerValueQuery({ address, key: keyName }, { skip: !open || !keyName || !address })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        View Value: {keyName} (Player: {address})
      </DialogTitle>
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

const PlayerPage = () => {
  const { data: players, isLoading, refetch: refetchPlayers } = useListPlayersQuery()
  const [setPlayerValue] = useSetPlayerValueMutation()
  const [deletePlayerValue] = useDeletePlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()
  const [clearAllPlayers] = useClearAllPlayersMutation()

  // Selected player for viewing keys
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isClearPlayerDialogOpen, setIsClearPlayerDialogOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [selectedKey, setSelectedKey] = useState<string>('')

  // Form state
  const [newAddress, setNewAddress] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const handleSelectPlayer = useCallback((address: string) => {
    setSelectedPlayer(prev => (prev === address ? null : address))
  }, [])

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
        await setPlayerValue({ address: newAddress.trim(), key: newKey.trim(), value: parsedValue })
        setIsAddDialogOpen(false)
        refetchPlayers()
      } catch {
        // Invalid JSON - could show error to user
      }
    }
  }, [newAddress, newKey, newValue, setPlayerValue, refetchPlayers])

  const handleOpenViewDialog = useCallback((address: string, key: string) => {
    setSelectedAddress(address)
    setSelectedKey(key)
    setIsViewDialogOpen(true)
  }, [])

  const handleCloseViewDialog = useCallback(() => {
    setIsViewDialogOpen(false)
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
      await deletePlayerValue({ address: selectedAddress, key: selectedKey })
      setIsDeleteDialogOpen(false)
      setSelectedAddress('')
      setSelectedKey('')
      refetchPlayers()
    }
  }, [selectedAddress, selectedKey, deletePlayerValue, refetchPlayers])

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
      await clearPlayer({ address: selectedAddress })
      setIsClearPlayerDialogOpen(false)
      setSelectedAddress('')
      setSelectedPlayer(null)
      refetchPlayers()
    }
  }, [selectedAddress, clearPlayer, refetchPlayers])

  const handleOpenClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(true)
  }, [])

  const handleCloseClearAllDialog = useCallback(() => {
    setIsClearAllDialogOpen(false)
  }, [])

  const handleConfirmClearAll = useCallback(async () => {
    await clearAllPlayers()
    setIsClearAllDialogOpen(false)
    setSelectedPlayer(null)
    refetchPlayers()
  }, [clearAllPlayers, refetchPlayers])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  const hasPlayers = players && players.length > 0

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Player Storage</Typography>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mr: 1 }}>
            Add
          </Button>
          {hasPlayers && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={handleOpenClearAllDialog}>
              Clear All Players
            </Button>
          )}
        </Box>
      </Box>

      {hasPlayers ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player Address</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map(player => (
                <TableRow key={player.address} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Button
                      variant="text"
                      onClick={() => handleSelectPlayer(player.address)}
                      sx={{ fontFamily: 'monospace', textTransform: 'none' }}
                      aria-label={`select ${player.address}`}
                    >
                      {player.address}
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleOpenClearPlayerDialog(player.address)}
                      aria-label={`clear ${player.address}`}
                    >
                      Clear
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No players found</Typography>
        </Paper>
      )}

      {/* Player Keys Section */}
      {selectedPlayer && <PlayerKeysSection address={selectedPlayer} onView={handleOpenViewDialog} onDelete={handleOpenDeleteDialog} />}

      {/* View Dialog */}
      <ViewDialog address={selectedAddress} keyName={selectedKey} open={isViewDialogOpen} onClose={handleCloseViewDialog} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Player Value</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="player-address"
            label="Player Address"
            type="text"
            fullWidth
            variant="outlined"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder="0x..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="player-key"
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
            id="player-value"
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
          <Button onClick={handleSaveValue} variant="contained" disabled={!newAddress.trim() || !newKey.trim() || !newValue.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Player Value</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the value &quot;{selectedKey}&quot; for player &quot;{selectedAddress}&quot;? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Player Confirmation Dialog */}
      <Dialog open={isClearPlayerDialogOpen} onClose={handleCloseClearPlayerDialog}>
        <DialogTitle>Clear Player Storage</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete ALL values for player &quot;{selectedAddress}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearPlayerDialog}>Cancel</Button>
          <Button onClick={handleConfirmClearPlayer} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Players Confirmation Dialog */}
      <Dialog open={isClearAllDialogOpen} onClose={handleCloseClearAllDialog}>
        <DialogTitle>Clear All Player Storage</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete ALL player storage data? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearAllDialog}>Cancel</Button>
          <Button onClick={handleConfirmClearAll} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

interface PlayerKeysSectionProps {
  address: string
  onView: (address: string, key: string) => void
  onDelete: (address: string, key: string) => void
}

const PlayerKeysSection = ({ address, onView, onDelete }: PlayerKeysSectionProps) => {
  const { data: playerKeys, isLoading } = useListPlayerKeysQuery({ address })

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress aria-label="Loading player keys" />
      </Box>
    )
  }

  if (!playerKeys || playerKeys.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No keys found for this player</Typography>
      </Paper>
    )
  }

  return (
    <Box mt={2}>
      <Typography variant="h6" gutterBottom>
        Keys for {address}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerKeys.map(item => (
              <TableRow key={item.key}>
                <TableCell>{item.key}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label={`view ${item.key}`} color="primary" onClick={() => onView(address, item.key)}>
                    <VisibilityIcon />
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
