import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import { useGetContributableDomainsQuery, useGetUserDCLNamesQuery, useGetUserLandsQuery } from './assets.client'
import { LandType, RoleType } from './assets.types'

const createWrapper = () => {
  const store = setupStore()
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return Wrapper
}

describe('assets client', () => {
  describe('useGetUserLandsQuery', () => {
    describe('when fetching user lands', () => {
      it('should return owned parcels', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetUserLandsQuery({ address: '0xuser' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const ownedParcels = result.current.data?.filter(land => land.type === LandType.PARCEL && land.role === RoleType.OWNER)
        expect(ownedParcels?.length).toBeGreaterThan(0)
      })

      it('should return operated parcels', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetUserLandsQuery({ address: '0xuser' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const operatedParcels = result.current.data?.filter(land => land.role === RoleType.OPERATOR)
        expect(operatedParcels?.length).toBeGreaterThan(0)
      })

      it('should return estates', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetUserLandsQuery({ address: '0xuser' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        const estates = result.current.data?.filter(land => land.type === LandType.ESTATE)
        expect(estates?.length).toBeGreaterThan(0)
        expect(estates?.[0].parcels?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('useGetUserDCLNamesQuery', () => {
    describe('when fetching user DCL names', () => {
      it('should return list of .dcl.eth domains', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetUserDCLNamesQuery({ address: '0xuser' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toContain('myworld.dcl.eth')
        expect(result.current.data).toContain('testscene.dcl.eth')
        result.current.data?.forEach(name => {
          expect(name).toMatch(/\.dcl\.eth$/)
        })
      })
    })
  })

  describe('useGetContributableDomainsQuery', () => {
    describe('when fetching contributable domains', () => {
      it('should return worlds where user has deployment permission', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetContributableDomainsQuery({ address: '0xuser' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.length).toBeGreaterThan(0)
        expect(result.current.data?.[0]).toHaveProperty('name')
        expect(result.current.data?.[0]).toHaveProperty('userPermissions')
        expect(result.current.data?.[0].name).toBe('shared-world.dcl.eth')
      })
    })
  })
})
