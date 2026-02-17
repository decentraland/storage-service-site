import { useCallback, useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { useTranslation } from '@dcl/hooks'

interface AddValueDialogProps {
  open: boolean
  onClose: () => void
  onSave: (address: string, key: string, value: unknown) => Promise<void>
  /** When provided, the address field is pre-filled and disabled (detail view). */
  address?: string
}

const AddValueDialog: FC<AddValueDialogProps> = ({ open, onClose, onSave, address: fixedAddress }) => {
  const { t } = useTranslation()
  const [address, setAddress] = useState('')
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) {
      setAddress(fixedAddress ?? '')
      setKey('')
      setValue('')
    }
  }, [open, fixedAddress])

  const handleSave = useCallback(async () => {
    const trimmedAddress = (fixedAddress ?? address).trim()
    const trimmedKey = key.trim()
    const trimmedValue = value.trim()

    if (!trimmedAddress || !trimmedKey || !trimmedValue) {
      return
    }

    try {
      const parsedValue = JSON.parse(trimmedValue)
      await onSave(trimmedAddress, trimmedKey, parsedValue)
      onClose()
    } catch {
      // Invalid JSON -- could show error to user
    }
  }, [fixedAddress, address, key, value, onSave, onClose])

  const isAddressFixed = fixedAddress !== undefined
  const isSaveDisabled = isAddressFixed ? !key.trim() || !value.trim() : !address.trim() || !key.trim() || !value.trim()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('player_page.add_dialog.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus={!isAddressFixed}
          margin="dense"
          id="player-address"
          label={t('player_page.add_dialog.address_label')}
          type="text"
          fullWidth
          variant="outlined"
          value={isAddressFixed ? fixedAddress : address}
          onChange={isAddressFixed ? undefined : e => setAddress(e.target.value)}
          placeholder={t('player_page.address_placeholder')}
          disabled={isAddressFixed}
          sx={{ mb: 2 }}
        />
        <TextField
          autoFocus={isAddressFixed}
          margin="dense"
          id="player-key"
          label={t('player_page.add_dialog.key_label')}
          type="text"
          fullWidth
          variant="outlined"
          value={key}
          onChange={e => setKey(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          id="player-value"
          label={t('player_page.add_dialog.value_label')}
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('player_page.add_dialog.value_placeholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaveDisabled}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { AddValueDialog }
export type { AddValueDialogProps }
