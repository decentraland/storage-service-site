enum LandType {
  PARCEL = 'parcel',
  ESTATE = 'estate'
}

enum RoleType {
  OWNER = 1,
  LESSOR = 2,
  TENANT = 3,
  OPERATOR = 4
}

interface Land {
  id: string
  tokenId: string
  type: LandType
  role: RoleType
  x?: number
  y?: number
  parcels?: { x: number; y: number; id: string }[]
  size?: number
  name: string
  description: string | null
  owner: string
  operators: string[]
}

interface World {
  name: string
  role: 'owner' | 'collaborator'
}

/** Raw API response shape from Worlds Content Server */
interface ContributableDomainRaw {
  name: string
  user_permissions: string[]
  size: string
  owner: string
}

interface ContributableDomain {
  name: string
  userPermissions: string[]
  size: string
  owner: string
}

// Subgraph response types
interface SubgraphParcel {
  x: string
  y: string
  tokenId: string
  owner: { address: string }
  updateOperator: string | null
  data: { name: string | null; description: string | null } | null
}

interface SubgraphEstate {
  id: string
  tokenId: string
  owner: { address: string }
  updateOperator: string | null
  size: number
  parcels: { x: string; y: string; id: string }[]
  data: { name: string | null; description: string | null } | null
}

interface SubgraphAuthorization {
  operator: string
  isApproved: boolean
  tokenAddress: string
}

interface LandQueryResult {
  ownerParcels: SubgraphParcel[]
  ownerEstates: SubgraphEstate[]
  updateOperatorParcels: SubgraphParcel[]
  updateOperatorEstates: SubgraphEstate[]
  tenantParcels: SubgraphParcel[]
  tenantEstates: SubgraphEstate[]
  lessorParcels: SubgraphParcel[]
  lessorEstates: SubgraphEstate[]
  ownerAuthorizations: SubgraphAuthorization[]
  operatorAuthorizations: SubgraphAuthorization[]
}

interface ContributableDomainsResponse {
  domains: ContributableDomainRaw[]
}

interface DCLNamesResponse {
  data: {
    nfts: { ens: { subdomain: string } }[]
  }
}

interface LandQueryResponse {
  data: LandQueryResult
}

type RentalFields = {
  id: string
  contractAddress: string
  tokenId: string
  lessor: string
  tenant: string
  operator: string
  startedAt: string
  endsAt: string
}

interface Rental {
  id: string
  type: LandType
  tokenId: string
  lessor: string
  tenant: string
  operator: string
  startedAt: Date
  endsAt: Date
}

interface RentalsQueryResult {
  tenantRentals: RentalFields[]
  lessorRentals: RentalFields[]
}

interface RentalsQueryResponse {
  data: RentalsQueryResult
}

export { LandType, RoleType }
export type {
  ContributableDomain,
  ContributableDomainRaw,
  ContributableDomainsResponse,
  DCLNamesResponse,
  Land,
  LandQueryResponse,
  LandQueryResult,
  SubgraphAuthorization,
  SubgraphEstate,
  SubgraphParcel,
  World,
  Rental,
  RentalsQueryResponse,
  RentalsQueryResult,
  RentalFields
}
