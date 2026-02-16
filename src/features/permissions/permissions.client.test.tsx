import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { setupStore } from '@/app/store'
import { useGetParcelOperatorsQuery, useGetRealmPermissionsQuery } from './permissions.client'

const createWrapper = () => {
  const store = setupStore()
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return Wrapper
}

describe('permissions client', () => {
  describe('useGetRealmPermissionsQuery', () => {
    describe('when fetching realm permissions', () => {
      it('should return permissions data', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetRealmPermissionsQuery({ realm: 'test.dcl.eth' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.owner).toBe('0xowner')
        expect(result.current.data?.permissions.deployment.wallets).toContain('0x123')
      })

      it('should return deployment wallets list', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetRealmPermissionsQuery({ realm: 'test.dcl.eth' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.permissions.deployment.wallets).toEqual(['0x123', '0x456'])
      })
    })

    describe('when realm has no permissions for user', () => {
      it('should return empty wallets list', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetRealmPermissionsQuery({ realm: 'unauthorized.dcl.eth' }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.permissions.deployment.wallets).not.toContain('0x123')
        expect(result.current.data?.owner).toBe('0xother')
      })
    })
  })

  describe('useGetParcelOperatorsQuery', () => {
    describe('when fetching parcel operators', () => {
      it('should return operators data', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetParcelOperatorsQuery({ x: 10, y: 20 }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.owner).toBe('0xowner')
        expect(result.current.data?.updateOperator).toBe('0x789')
      })

      it('should return approvedForAll list', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetParcelOperatorsQuery({ x: 10, y: 20 }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.approvedForAll).toContain('0xapproved')
      })
    })

    describe('when parcel has no operators', () => {
      it('should return null for updateOperator', async () => {
        const wrapper = createWrapper()

        const { result } = renderHook(() => useGetParcelOperatorsQuery({ x: 999, y: 999 }), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.updateOperator).toBeNull()
        expect(result.current.data?.approvedForAll).toEqual([])
      })
    })
  })
})
