import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'

const NotFound = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Typography variant="h2" gutterBottom>
        {t('not_found_page.code')}
      </Typography>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        {t('not_found_page.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('not_found_page.subtitle')}
      </Typography>
      <Button variant="contained" onClick={handleGoHome}>
        {t('not_found_page.go_home')}
      </Button>
    </Box>
  )
}

export { NotFound }
