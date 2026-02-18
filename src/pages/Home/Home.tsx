import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const Home = () => {
  return (
    <Box>
      <Typography variant="h4">Storage Service</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Manage your Decentraland world and scene storage.
      </Typography>
    </Box>
  )
}

export { Home }
