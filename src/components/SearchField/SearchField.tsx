import { memo } from 'react'
import type { ChangeEvent, FC } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useTranslation } from '@dcl/hooks'

interface SearchFieldProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder: string
  ariaLabel?: string
}

const SearchFieldComponent: FC<SearchFieldProps> = ({ value, onChange, onClear, placeholder, ariaLabel }) => {
  const { t } = useTranslation()

  return (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="small"
      fullWidth
      inputProps={{ 'aria-label': ariaLabel ?? placeholder }}
      sx={{ mb: 3, maxWidth: 400, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.04)' } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={onClear} aria-label={t('select_page.clear_search')} edge="end">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null
      }}
    />
  )
}

const SearchField = memo(SearchFieldComponent)
SearchField.displayName = 'SearchField'

export { SearchField }
