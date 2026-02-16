import { fromUnixTime } from 'date-fns/fromUnixTime'
import { config } from '@/config'
import { LandType, RoleType } from './assets.types'
import type { Land, LandQueryResult, Rental, RentalFields, RentalsQueryResult, SubgraphEstate, SubgraphParcel } from './assets.types'

const LAND_REGISTRY_ADDRESS = config.get('LAND_REGISTRY_ADDRESS')
const ESTATE_REGISTRY_ADDRESS = config.get('ESTATE_REGISTRY_ADDRESS')
const MAX_RESULTS = 1000

const parcelToLand = (parcel: SubgraphParcel, role: RoleType): Land => ({
  id: `parcel-${parcel.x}-${parcel.y}`,
  tokenId: parcel.tokenId,
  type: LandType.PARCEL,
  role,
  x: parseInt(parcel.x, 10),
  y: parseInt(parcel.y, 10),
  name: parcel.data?.name ?? `Parcel (${parcel.x}, ${parcel.y})`,
  description: parcel.data?.description ?? null,
  owner: parcel.owner.address,
  operators: parcel.updateOperator ? [parcel.updateOperator] : []
})

const estateToLand = (estate: SubgraphEstate, role: RoleType): Land => ({
  id: `estate-${estate.id}`,
  tokenId: estate.tokenId,
  type: LandType.ESTATE,
  role,
  parcels: estate.parcels.map(p => ({
    x: parseInt(p.x, 10),
    y: parseInt(p.y, 10),
    id: p.id
  })),
  size: estate.size,
  name: estate.data?.name ?? `Estate #${estate.id}`,
  description: estate.data?.description ?? null,
  owner: estate.owner.address,
  operators: estate.updateOperator ? [estate.updateOperator] : []
})

const mergeLandsIntoMap = (landsMap: Map<string, Land>, parcels: SubgraphParcel[], estates: SubgraphEstate[], role: RoleType): void => {
  for (const parcel of parcels) {
    const land = parcelToLand(parcel, role)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }
  for (const estate of estates) {
    const land = estateToLand(estate, role)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }
}

/**
 * Transform land subgraph query result into a flat array of Land objects.
 * Deduplicates by land id.
 */
const transformLandQueryResult = (data: LandQueryResult): Land[] => {
  const landsMap = new Map<string, Land>()

  // Owner parcels (take precedence)
  for (const parcel of data.ownerParcels) {
    const land = parcelToLand(parcel, RoleType.OWNER)
    landsMap.set(land.id, land)
  }

  // Owner estates (take precedence)
  for (const estate of data.ownerEstates) {
    const land = estateToLand(estate, RoleType.OWNER)
    landsMap.set(land.id, land)
  }

  mergeLandsIntoMap(landsMap, data.updateOperatorParcels, data.updateOperatorEstates, RoleType.OPERATOR)
  mergeLandsIntoMap(landsMap, data.tenantParcels, data.tenantEstates, RoleType.TENANT)
  mergeLandsIntoMap(landsMap, data.lessorParcels, data.lessorEstates, RoleType.LESSOR)

  return Array.from(landsMap.values())
}

/**
 * Build GraphQL query for the Land Manager subgraph
 */
const getLandQuery = (skip = 0): string => {
  return `
    query GetLands($address: Bytes, $tenantTokenIds: [String!], $lessorTokenIds: [String!]) {
      tenantParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { tokenId_in: $tenantTokenIds }) {
        ...parcelFields
      }
      tenantEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { id_in: $tenantTokenIds }) {
        ...estateFields
      }
      lessorParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { tokenId_in: $lessorTokenIds }) {
        ...parcelFields
      }
      lessorEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { id_in: $lessorTokenIds }) {
        ...estateFields
      }
      ownerParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { estate: null, owner: $address }) {
        ...parcelFields
      }
      ownerEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { owner: $address }) {
        ...estateFields
      }
      updateOperatorParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { updateOperator: $address }) {
        ...parcelFields
      }
      updateOperatorEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { updateOperator: $address }) {
        ...estateFields
      }
      ownerAuthorizations: authorizations(first: ${MAX_RESULTS}, skip: ${skip}, where: { owner: $address, type: "UpdateManager" }) {
        operator
        isApproved
        tokenAddress
      }
      operatorAuthorizations: authorizations(first: ${MAX_RESULTS}, skip: ${skip}, where: { operator: $address, type: "UpdateManager" }) {
        owner {
          address
          parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { estate: null }) {
            ...parcelFields
          }
          estates(first: ${MAX_RESULTS}) {
            ...estateFields
          }
        }
        isApproved
        tokenAddress
      }
    }

    fragment parcelFields on Parcel {
      x
      y
      tokenId
      owner {
        address
      }
      updateOperator
      data {
        name
        description
      }
    }

    fragment estateFields on Estate {
      id
      owner {
        address
      }
      updateOperator
      size
      parcels(first: 1000) {
        x
        y
        tokenId
      }
      data {
        name
        description
      }
    }
  `
}

/**
 * Get the position string for a Land (e.g. "10,20")
 */
const getLandPosition = (land: Land): string | null => {
  if (land.type === LandType.PARCEL && land.x !== undefined && land.y !== undefined) {
    return `${land.x},${land.y}`
  }
  if (land.type === LandType.ESTATE && land.parcels && land.parcels.length > 0) {
    return `${land.parcels[0].x},${land.parcels[0].y}`
  }
  return null
}

/**
 * Get display label for a role type
 */
const getRoleLabel = (role: RoleType): string => {
  switch (role) {
    case RoleType.OWNER:
      return 'Owner'
    case RoleType.OPERATOR:
      return 'Operator'
    case RoleType.TENANT:
      return 'Tenant'
    case RoleType.LESSOR:
      return 'Lessor'
    default:
      return 'Unknown'
  }
}

const getRentalsQuery = () => `
  query Rentals($address: Bytes) {
    tenantRentals: rentals(where: { tenant: $address, isActive: true }) {
      ...rentalFields
    }
    lessorRentals: rentals(where: { lessor: $address, isActive: true }) {
      ...rentalFields
    }
  }
  
  fragment rentalFields on Rental {
    id
    contractAddress
    tokenId
    lessor
    tenant
    operator
    startedAt
    endsAt
  }
`

const getLandType = (contractAddress: string): LandType => {
  switch (contractAddress.toLowerCase()) {
    case LAND_REGISTRY_ADDRESS:
      return LandType.PARCEL
    case ESTATE_REGISTRY_ADDRESS:
      return LandType.ESTATE
    default:
      throw new Error(`Could not derive land type from contract address "${contractAddress}"`)
  }
}

const fromRentalFields = (fields: RentalFields): Rental => {
  return {
    id: fields.id,
    type: getLandType(fields.contractAddress),
    tokenId: fields.tokenId,
    lessor: fields.lessor,
    tenant: fields.tenant,
    operator: fields.operator,
    startedAt: fromUnixTime(+fields.startedAt),
    endsAt: fromUnixTime(+fields.endsAt)
  }
}

const transformRentalsQueryResult = (data: RentalsQueryResult): { lessorRentals: Rental[]; tenantRentals: Rental[] } => {
  return {
    lessorRentals: data.lessorRentals.map(fromRentalFields),
    tenantRentals: data.tenantRentals.map(fromRentalFields)
  }
}

export { getLandPosition, getLandQuery, getLandType, getRentalsQuery, getRoleLabel, transformLandQueryResult, transformRentalsQueryResult }
