import { useMemo } from 'react'
import { useAuth } from '@/features/auth'
import { useGetContributableDomainsQuery, useGetUserDCLNamesQuery } from '../assets.client'
import type { ContributableDomain, World } from '../assets.types'

interface UseGetWorldsResult {
  allWorlds: World[]
  dclNames: string[] | undefined
  contributableNames: ContributableDomain[] | undefined
  isLoading: boolean
}

const useGetWorlds = (): UseGetWorldsResult => {
  const { wallet, isSignedIn } = useAuth()

  const { data: dclNames, isLoading: namesLoading } = useGetUserDCLNamesQuery({ address: wallet ?? '' }, { skip: !wallet })

  const { data: contributableNames, isLoading: contribLoading } = useGetContributableDomainsQuery(
    { address: wallet ?? '', wallet, isSignedIn },
    { skip: !wallet }
  )

  const isLoading = namesLoading || contribLoading

  const allWorlds: World[] = useMemo(() => {
    const worlds: World[] = []
    const seen = new Set<string>()

    for (const name of dclNames ?? []) {
      if (!seen.has(name)) {
        seen.add(name)
        worlds.push({ name, role: 'owner' })
      }
    }

    for (const domain of contributableNames ?? []) {
      if (!seen.has(domain.name)) {
        seen.add(domain.name)
        worlds.push({ name: domain.name, role: 'collaborator' })
      }
    }

    return worlds
  }, [dclNames, contributableNames])

  return { allWorlds, dclNames, contributableNames, isLoading }
}

export { useGetWorlds }
export type { UseGetWorldsResult }
