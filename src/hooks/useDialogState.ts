import { useCallback, useState } from 'react'

interface DialogState {
  isOpen: boolean
  handleOpen: () => void
  handleClose: () => void
}

const useDialogState = (): DialogState => {
  const [isOpen, setIsOpen] = useState(false)
  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])
  return { isOpen, handleOpen, handleClose }
}

export { useDialogState }
export type { DialogState }
