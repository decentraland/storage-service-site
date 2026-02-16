import { describe, expect, it } from 'vitest'
import { getLandPosition, getRoleLabel, transformLandQueryResult } from './assets.utils'
import { LandType, RoleType } from './assets.types'
import type { Land, LandQueryResult } from './assets.types'

describe('assets utils', () => {
  describe('transformLandQueryResult', () => {
    describe('when result has owner parcels', () => {
      it('should return parcels with OWNER role', () => {
        const data: LandQueryResult = {
          ownerParcels: [
            {
              x: '10',
              y: '20',
              tokenId: '123',
              owner: { address: '0xuser' },
              updateOperator: null,
              data: { name: 'My Parcel', description: null }
            }
          ],
          ownerEstates: [],
          updateOperatorParcels: [],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result).toHaveLength(1)
        expect(result[0].type).toBe(LandType.PARCEL)
        expect(result[0].role).toBe(RoleType.OWNER)
        expect(result[0].x).toBe(10)
        expect(result[0].y).toBe(20)
        expect(result[0].name).toBe('My Parcel')
      })
    })

    describe('when result has owner estates', () => {
      it('should return estates with OWNER role', () => {
        const data: LandQueryResult = {
          ownerParcels: [],
          ownerEstates: [
            {
              id: '1',
              tokenId: '456',
              owner: { address: '0xuser' },
              updateOperator: null,
              size: 4,
              parcels: [
                { x: '5', y: '6', id: 'p1' },
                { x: '5', y: '7', id: 'p2' }
              ],
              data: { name: 'My Estate', description: 'A big estate' }
            }
          ],
          updateOperatorParcels: [],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result).toHaveLength(1)
        expect(result[0].type).toBe(LandType.ESTATE)
        expect(result[0].role).toBe(RoleType.OWNER)
        expect(result[0].size).toBe(4)
        expect(result[0].parcels).toHaveLength(2)
        expect(result[0].name).toBe('My Estate')
      })
    })

    describe('when result has operator parcels', () => {
      it('should return parcels with OPERATOR role', () => {
        const data: LandQueryResult = {
          ownerParcels: [],
          ownerEstates: [],
          updateOperatorParcels: [
            {
              x: '30',
              y: '40',
              tokenId: '789',
              owner: { address: '0xother' },
              updateOperator: '0xuser',
              data: { name: 'Operated Parcel', description: null }
            }
          ],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result).toHaveLength(1)
        expect(result[0].role).toBe(RoleType.OPERATOR)
        expect(result[0].operators).toContain('0xuser')
      })
    })

    describe('when result has duplicate parcels (owner + operator)', () => {
      it('should deduplicate keeping the first occurrence (owner)', () => {
        const data: LandQueryResult = {
          ownerParcels: [
            {
              x: '10',
              y: '20',
              tokenId: '123',
              owner: { address: '0xuser' },
              updateOperator: null,
              data: { name: 'My Parcel', description: null }
            }
          ],
          ownerEstates: [],
          updateOperatorParcels: [
            {
              x: '10',
              y: '20',
              tokenId: '123',
              owner: { address: '0xuser' },
              updateOperator: '0xuser',
              data: { name: 'My Parcel', description: null }
            }
          ],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result).toHaveLength(1)
        expect(result[0].role).toBe(RoleType.OWNER)
      })
    })

    describe('when result has empty data', () => {
      it('should return empty array', () => {
        const data: LandQueryResult = {
          ownerParcels: [],
          ownerEstates: [],
          updateOperatorParcels: [],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result).toHaveLength(0)
      })
    })

    describe('when parcel has no name', () => {
      it('should use coordinate-based fallback name', () => {
        const data: LandQueryResult = {
          ownerParcels: [
            {
              x: '10',
              y: '20',
              tokenId: '123',
              owner: { address: '0xuser' },
              updateOperator: null,
              data: null
            }
          ],
          ownerEstates: [],
          updateOperatorParcels: [],
          updateOperatorEstates: [],
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }

        const result = transformLandQueryResult(data)

        expect(result[0].name).toBe('Parcel (10, 20)')
      })
    })
  })

  describe('getLandPosition', () => {
    describe('when land is a parcel', () => {
      it('should return x,y coordinates', () => {
        const land: Land = {
          id: 'parcel-10-20',
          tokenId: '123',
          type: LandType.PARCEL,
          role: RoleType.OWNER,
          x: 10,
          y: 20,
          name: 'Test',
          description: null,
          owner: '0x',
          operators: []
        }

        expect(getLandPosition(land)).toBe('10,20')
      })
    })

    describe('when land is an estate', () => {
      it('should return first parcel coordinates', () => {
        const land: Land = {
          id: 'estate-1',
          tokenId: '456',
          type: LandType.ESTATE,
          role: RoleType.OWNER,
          parcels: [
            { x: 5, y: 6, id: 'p1' },
            { x: 5, y: 7, id: 'p2' }
          ],
          size: 2,
          name: 'Test Estate',
          description: null,
          owner: '0x',
          operators: []
        }

        expect(getLandPosition(land)).toBe('5,6')
      })
    })

    describe('when estate has no parcels', () => {
      it('should return null', () => {
        const land: Land = {
          id: 'estate-1',
          tokenId: '456',
          type: LandType.ESTATE,
          role: RoleType.OWNER,
          parcels: [],
          size: 0,
          name: 'Empty Estate',
          description: null,
          owner: '0x',
          operators: []
        }

        expect(getLandPosition(land)).toBeNull()
      })
    })
  })

  describe('getRoleLabel', () => {
    it('should return "Owner" for OWNER role', () => {
      expect(getRoleLabel(RoleType.OWNER)).toBe('Owner')
    })

    it('should return "Operator" for OPERATOR role', () => {
      expect(getRoleLabel(RoleType.OPERATOR)).toBe('Operator')
    })

    it('should return "Tenant" for TENANT role', () => {
      expect(getRoleLabel(RoleType.TENANT)).toBe('Tenant')
    })

    it('should return "Lessor" for LESSOR role', () => {
      expect(getRoleLabel(RoleType.LESSOR)).toBe('Lessor')
    })
  })
})
