import { hasParcelPermission, hasRealmPermission } from './permissions.utils'
import type { ParcelOperators, WorldPermissions } from './permissions.types'

describe('permissions utils', () => {
  describe('hasRealmPermission', () => {
    const mockPermissions: WorldPermissions = {
      permissions: {
        deployment: { type: 'allow-list', wallets: ['0x123', '0x456'] },
        streaming: { type: 'allow-list', wallets: [] },
        access: { type: 'unrestricted' }
      },
      owner: '0xowner',
      summary: {}
    }

    describe('when user is the owner', () => {
      it('should return true', () => {
        const result = hasRealmPermission(mockPermissions, '0xowner')

        expect(result).toBe(true)
      })
    })

    describe('when user is in deployment wallets', () => {
      it('should return true', () => {
        const result = hasRealmPermission(mockPermissions, '0x123')

        expect(result).toBe(true)
      })
    })

    describe('when user is not owner and not in deployment wallets', () => {
      it('should return false', () => {
        const result = hasRealmPermission(mockPermissions, '0xunauthorized')

        expect(result).toBe(false)
      })
    })

    describe('when checking with case-insensitive addresses', () => {
      it('should return true for owner with different case', () => {
        const result = hasRealmPermission(mockPermissions, '0xOWNER')

        expect(result).toBe(true)
      })

      it('should return true for wallet with different case', () => {
        const result = hasRealmPermission(mockPermissions, '0X123')

        expect(result).toBe(true)
      })
    })
  })

  describe('hasParcelPermission', () => {
    const mockOperators: ParcelOperators = {
      owner: '0xowner',
      operator: '0xoperator',
      updateOperator: '0xupdateoperator',
      updateManagers: ['0xmanager1', '0xmanager2'],
      approvedForAll: ['0xapproved']
    }

    describe('when user is the owner', () => {
      it('should return true', () => {
        const result = hasParcelPermission(mockOperators, '0xowner')

        expect(result).toBe(true)
      })
    })

    describe('when user is the operator', () => {
      it('should return true', () => {
        const result = hasParcelPermission(mockOperators, '0xoperator')

        expect(result).toBe(true)
      })
    })

    describe('when user is the updateOperator', () => {
      it('should return true', () => {
        const result = hasParcelPermission(mockOperators, '0xupdateoperator')

        expect(result).toBe(true)
      })
    })

    describe('when user is in approvedForAll', () => {
      it('should return true', () => {
        const result = hasParcelPermission(mockOperators, '0xapproved')

        expect(result).toBe(true)
      })
    })

    describe('when user has no permission', () => {
      it('should return false', () => {
        const result = hasParcelPermission(mockOperators, '0xunauthorized')

        expect(result).toBe(false)
      })
    })

    describe('when operator is null', () => {
      it('should not match null operator', () => {
        const operatorsWithNull: ParcelOperators = {
          ...mockOperators,
          operator: null
        }

        const result = hasParcelPermission(operatorsWithNull, '0xunauthorized')

        expect(result).toBe(false)
      })
    })

    describe('when checking with case-insensitive addresses', () => {
      it('should return true for owner with different case', () => {
        const result = hasParcelPermission(mockOperators, '0xOWNER')

        expect(result).toBe(true)
      })
    })
  })
})
