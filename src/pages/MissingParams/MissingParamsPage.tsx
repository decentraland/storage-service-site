import { Box, Typography } from 'decentraland-ui2'

const MissingParamsPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 1
      }}
    >
      <Typography variant="h5">Missing parameters</Typography>
      <Typography variant="body1" color="text.secondary">
        Provide at least one URL parameter: <code>realm</code> (world name) or <code>position</code> (parcel coordinates, e.g.{' '}
        <code>10,20</code>).
      </Typography>
    </Box>
  )
}

export { MissingParamsPage }
