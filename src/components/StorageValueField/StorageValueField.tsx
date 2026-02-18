import { forwardRef, useCallback, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import { useTranslation } from '@dcl/hooks'

/** Returns true when the trimmed value looks like a JSON object or array. */
const looksLikeStructuredJson = (value: string): boolean => {
  const trimmed = value.trimStart()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

/**
 * Formats a value for display in the text field.
 * Strings are shown raw (no wrapping quotes), everything else is pretty-printed JSON.
 */
const formatValueForDisplay = (value: unknown): string => {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

interface ParseResult {
  parsedValue: unknown | null
  isValid: boolean
  isJsonError: boolean
}

/**
 * Parses the raw text field value into a typed result.
 * If it looks like structured JSON (`{` or `[`), it must parse successfully or flags isJsonError.
 * Otherwise, the trimmed string is returned as the parsed value.
 */
const parseRawValue = (raw: string): ParseResult => {
  const trimmed = raw.trim()
  if (!trimmed) return { parsedValue: null, isValid: false, isJsonError: false }

  if (looksLikeStructuredJson(trimmed)) {
    try {
      return { parsedValue: JSON.parse(trimmed), isValid: true, isJsonError: false }
    } catch {
      return { parsedValue: null, isValid: false, isJsonError: true }
    }
  }

  return { parsedValue: trimmed, isValid: true, isJsonError: false }
}

/**
 * Parses the raw text field value into a typed value for the API.
 * Returns null if empty or invalid structured JSON.
 */
const parseValue = (raw: string): unknown | null => parseRawValue(raw).parsedValue

interface StorageValueFieldRef {
  /** Reset the field to empty state. */
  reset: () => void
  /** Get the parsed value for saving. Returns null if empty or invalid structured JSON. */
  getParsedValue: () => unknown | null
}

interface StorageValueFieldChangeEvent {
  /** The parsed value, or null if empty or invalid structured JSON. */
  parsedValue: unknown | null
  /** Whether the field has a non-empty, valid value. */
  isValid: boolean
}

type StorageValueFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'error'> & {
  /** The raw API value to display. Strings are shown without quotes, objects/arrays are pretty-printed. */
  defaultValue?: unknown
  /** Called on every change with the parsed value and validity state. */
  onChange?: (event: StorageValueFieldChangeEvent) => void
}

const StorageValueField = forwardRef<StorageValueFieldRef, StorageValueFieldProps>(({ defaultValue, onChange, ...textFieldProps }, ref) => {
  const { t } = useTranslation()
  const errorId = useId()
  const [value, setValue] = useState(() => (defaultValue !== undefined ? formatValueForDisplay(defaultValue) : ''))

  const valueRef = useRef(value)
  valueRef.current = value

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const jsonError = useMemo(() => {
    const { isJsonError } = parseRawValue(value)
    return isJsonError ? t('value_field.json_error') : null
  }, [value, t])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
    const result = parseRawValue(newValue)
    onChangeRef.current?.({ parsedValue: result.parsedValue, isValid: result.isValid })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        setValue('')
        onChangeRef.current?.({ parsedValue: null, isValid: false })
      },
      getParsedValue: () => parseRawValue(valueRef.current).parsedValue
    }),
    []
  )

  return (
    <>
      <TextField
        {...textFieldProps}
        value={value}
        onChange={e => handleChange(e.target.value)}
        error={!!jsonError}
        aria-describedby={jsonError ? errorId : undefined}
      />
      {jsonError ? (
        <Alert id={errorId} severity="error" sx={{ mt: 1 }}>
          {jsonError}
        </Alert>
      ) : null}
    </>
  )
})

StorageValueField.displayName = 'StorageValueField'

export { StorageValueField, formatValueForDisplay, looksLikeStructuredJson, parseValue }
export type { StorageValueFieldChangeEvent, StorageValueFieldProps, StorageValueFieldRef }
