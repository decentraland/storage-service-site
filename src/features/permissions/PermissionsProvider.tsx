import type { FC, ReactNode } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useAuth } from '@/features/auth'
import { UnauthorizedPage } from '@/pages/Unauthorized'
import { useGetParcelOperatorsQuery, useGetRealmPermissionsQuery } from './permissions.client'
import { hasParcelPermission, hasRealmPermission } from './permissions.utils'

interface PermissionsProviderProps {
  realm?: string
  position?: string
  children: ReactNode
}

const parsePosition = (position: string): { x: number; y: number } | null => {
  const parts = position.split(',').map(s => s.trim())
  if (parts.length !== 2) return null
  const x = parseInt(parts[0], 10)
  const y = parseInt(parts[1], 10)
  if (Number.isNaN(x) || Number.isNaN(y)) return null
  return { x, y }
}

const PermissionsProvider: FC<PermissionsProviderProps> = ({ realm, position, children }) => {
  const { wallet, isSignedIn } = useAuth()

  const coords = position ? parsePosition(position) : null

  const {
    data: realmPermissions,
    isLoading: isLoadingRealm,
    isError: isRealmError
  } = useGetRealmPermissionsQuery({ realm: realm ?? '' }, { skip: !realm })

  const {
    data: parcelOperators,
    isLoading: isLoadingParcel,
    isError: isParcelError
  } = useGetParcelOperatorsQuery({ x: coords?.x ?? 0, y: coords?.y ?? 0 }, { skip: !coords })

  const isLoading = realm ? isLoadingRealm : isLoadingParcel
  const isError = realm ? isRealmError : isParcelError

  if (!isSignedIn || !wallet) {
    return <UnauthorizedPage />
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress aria-label="Checking permissions" />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          Failed to load permissions.
        </Typography>
      </Box>
    )
  }

  const hasPermission = realm
    ? realmPermissions !== undefined && hasRealmPermission(realmPermissions, wallet)
    : parcelOperators !== undefined && coords !== null && hasParcelPermission(parcelOperators, wallet)

  if (!hasPermission) {
    return <UnauthorizedPage />
  }

  return <>{children}</>
}

export { PermissionsProvider }
