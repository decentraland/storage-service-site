import { useCallback, useState } from 'react'
import type { FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

interface StorageFormProps {
  keyLabel?: string
  valueLabel?: string
  submitLabel?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  onSubmit: (key: string, value: string) => void | Promise<void>
  disabled?: boolean
}

const StorageForm: FC<StorageFormProps> = ({
  keyLabel = 'Key',
  valueLabel = 'Value',
  submitLabel = 'Save',
  keyPlaceholder = '',
  valuePlaceholder = '{}',
  onSubmit,
  disabled = false
}) => {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedKey = key.trim()
      const trimmedValue = value.trim()
      if (trimmedKey && trimmedValue) {
        await onSubmit(trimmedKey, trimmedValue)
        setKey('')
        setValue('')
      }
    },
    [key, value, onSubmit]
  )

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label={keyLabel}
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder={keyPlaceholder}
        fullWidth
        size="small"
        disabled={disabled}
        inputProps={{ 'aria-label': keyLabel }}
      />
      <TextField
        label={valueLabel}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={valuePlaceholder}
        fullWidth
        multiline
        minRows={2}
        size="small"
        disabled={disabled}
        inputProps={{ 'aria-label': valueLabel }}
      />
      <Button type="submit" variant="contained" disabled={disabled || !key.trim() || !value.trim()} aria-label={submitLabel}>
        {submitLabel}
      </Button>
    </Box>
  )
}

export { StorageForm }
