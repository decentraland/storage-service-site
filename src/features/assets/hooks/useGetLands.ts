import { useMemo } from 'react'
import { useAuth } from '@/features/auth'
import { useGetUserLandsQuery, useGetUserRentalsQuery } from '../assets.client'
import type { Land } from '../assets.types'

interface UseGetLandsResult {
  lands: Land[] | undefined
  isLoading: boolean
}

const useGetLands = (): UseGetLandsResult => {
  const { wallet } = useAuth()

  const { data: rentals } = useGetUserRentalsQuery({ address: wallet ?? '' }, { skip: !wallet })

  const tenantTokenIds = useMemo(() => rentals?.tenantRentals?.map(r => r.tokenId) ?? [], [rentals?.tenantRentals])
  const lessorTokenIds = useMemo(() => rentals?.lessorRentals?.map(r => r.tokenId) ?? [], [rentals?.lessorRentals])

  const landsQueryArgs = useMemo(
    () => ({
      address: wallet ?? '',
      tenantTokenIds,
      lessorTokenIds
    }),
    [wallet, tenantTokenIds, lessorTokenIds]
  )

  const { data: lands, isLoading } = useGetUserLandsQuery(landsQueryArgs, {
    skip: !wallet
  })

  return { lands, isLoading }
}

export { useGetLands }
export type { UseGetLandsResult }
