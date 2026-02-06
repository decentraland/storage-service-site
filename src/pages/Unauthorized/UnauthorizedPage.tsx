import { Box, Button, Typography } from 'decentraland-ui2'

const UnauthorizedPage = () => {
  const handleClickGoBack = () => {
    window.history.back()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2
      }}
    >
      <Typography variant="h5">Access denied</Typography>
      <Typography variant="body1" color="text.secondary">
        You do not have permission to manage storage for this world or parcel.
      </Typography>
      <Button variant="contained" onClick={handleClickGoBack} aria-label="Go back">
        Go back
      </Button>
    </Box>
  )
}

export { UnauthorizedPage }
