import { LandType, RoleType } from './assets.types'
import type { Land, LandQueryResult, SubgraphEstate, SubgraphParcel } from './assets.types'

const LAND_CONTRACT_ADDRESS = '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d'
const ESTATE_CONTRACT_ADDRESS = '0x959e104e1a4db6317fa58f8295f586e1a978c297'

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

/**
 * Transform land subgraph query result into a flat array of Land objects.
 * Deduplicates by land id.
 */
const transformLandQueryResult = (data: LandQueryResult): Land[] => {
  const landsMap = new Map<string, Land>()

  // Owner parcels
  for (const parcel of data.ownerParcels) {
    const land = parcelToLand(parcel, RoleType.OWNER)
    landsMap.set(land.id, land)
  }

  // Owner estates
  for (const estate of data.ownerEstates) {
    const land = estateToLand(estate, RoleType.OWNER)
    landsMap.set(land.id, land)
  }

  // Operator parcels
  for (const parcel of data.updateOperatorParcels) {
    const land = parcelToLand(parcel, RoleType.OPERATOR)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  // Operator estates
  for (const estate of data.updateOperatorEstates) {
    const land = estateToLand(estate, RoleType.OPERATOR)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  // Tenant parcels
  for (const parcel of data.tenantParcels) {
    const land = parcelToLand(parcel, RoleType.TENANT)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  // Tenant estates
  for (const estate of data.tenantEstates) {
    const land = estateToLand(estate, RoleType.TENANT)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  // Lessor parcels
  for (const parcel of data.lessorParcels) {
    const land = parcelToLand(parcel, RoleType.LESSOR)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  // Lessor estates
  for (const estate of data.lessorEstates) {
    const land = estateToLand(estate, RoleType.LESSOR)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }

  return Array.from(landsMap.values())
}

/**
 * Build GraphQL query for the Land Manager subgraph
 */
const getLandQuery = (): string => {
  return `
    query GetLands(
      $address: String!,
      $tenantTokenIds: [String!],
      $lessorTokenIds: [String!]
    ) {
      ownerParcels: parcels(
        first: 1000,
        where: { owner: $address }
      ) {
        ...parcelFields
      }
      ownerEstates: estates(
        first: 1000,
        where: { owner: $address }
      ) {
        ...estateFields
      }
      updateOperatorParcels: parcels(
        first: 1000,
        where: { updateOperator: $address }
      ) {
        ...parcelFields
      }
      updateOperatorEstates: estates(
        first: 1000,
        where: { updateOperator: $address }
      ) {
        ...estateFields
      }
      tenantParcels: parcels(
        first: 1000,
        where: { tokenId_in: $tenantTokenIds }
      ) {
        ...parcelFields
      }
      tenantEstates: estates(
        first: 1000,
        where: { tokenId_in: $tenantTokenIds }
      ) {
        ...estateFields
      }
      lessorParcels: parcels(
        first: 1000,
        where: { tokenId_in: $lessorTokenIds }
      ) {
        ...parcelFields
      }
      lessorEstates: estates(
        first: 1000,
        where: { tokenId_in: $lessorTokenIds }
      ) {
        ...estateFields
      }
      ownerAuthorizations: authorizations(
        first: 1000,
        where: {
          owner: $address,
          type: "UpdateManager",
          isApproved: true,
          tokenAddress_in: ["${LAND_CONTRACT_ADDRESS}", "${ESTATE_CONTRACT_ADDRESS}"]
        }
      ) {
        operator
        isApproved
        tokenAddress
      }
      operatorAuthorizations: authorizations(
        first: 1000,
        where: {
          operator: $address,
          type: "UpdateManager",
          isApproved: true,
          tokenAddress_in: ["${LAND_CONTRACT_ADDRESS}", "${ESTATE_CONTRACT_ADDRESS}"]
        }
      ) {
        operator
        isApproved
        tokenAddress
      }
    }

    fragment parcelFields on Parcel {
      x
      y
      tokenId
      owner { address }
      updateOperator
      data { name description }
    }

    fragment estateFields on Estate {
      id
      tokenId
      owner { address }
      updateOperator
      size
      parcels { x y id }
      data { name description }
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

export { getLandPosition, getLandQuery, getRoleLabel, transformLandQueryResult }
