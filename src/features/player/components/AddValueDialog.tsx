import { useCallback, useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useTranslation } from '@dcl/hooks'
import { StorageValueField, type StorageValueFieldRef } from '@/components/StorageValueField'

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
  const [isValueValid, setIsValueValid] = useState(false)
  const fieldRef = useRef<StorageValueFieldRef>(null)

  useEffect(() => {
    if (open) {
      setAddress(fixedAddress ?? '')
      setKey('')
      setIsValueValid(false)
      fieldRef.current?.reset()
    }
  }, [open, fixedAddress])

  const handleSave = useCallback(async () => {
    const trimmedAddress = (fixedAddress ?? address).trim()
    const trimmedKey = key.trim()

    if (!trimmedAddress || !trimmedKey) return

    const parsedValue = fieldRef.current?.getParsedValue() ?? null
    if (parsedValue === null) return

    await onSave(trimmedAddress, trimmedKey, parsedValue)
    onClose()
  }, [fixedAddress, address, key, onSave, onClose])

  const isAddressFixed = fixedAddress !== undefined
  const isSaveDisabled = !isValueValid || !key.trim() || (!isAddressFixed && !address.trim())

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
        <StorageValueField
          ref={fieldRef}
          onChange={e => setIsValueValid(e.isValid)}
          margin="dense"
          id="player-value"
          label={t('player_page.add_dialog.value_label')}
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
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
