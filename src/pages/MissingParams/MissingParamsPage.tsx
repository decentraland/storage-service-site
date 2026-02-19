import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from '@dcl/hooks'

const MissingParamsPage = () => {
  const { t } = useTranslation()

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
      <Typography variant="h5">{t('missing_params_page.title')}</Typography>
      <Typography variant="body1" color="text.secondary">
        {t('missing_params_page.subtitle', { realm: 'realm', position: 'position', example: '10,20' })}
      </Typography>
    </Box>
  )
}

export { MissingParamsPage }
