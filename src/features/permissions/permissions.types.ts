interface DeploymentPermission {
  type: 'allow-list' | 'unrestricted'
  wallets: string[]
}

interface StreamingPermission {
  type: 'allow-list' | 'unrestricted'
  wallets: string[]
}

interface AccessPermission {
  type: 'unrestricted' | 'nft-ownership' | 'allow-list'
}

interface WorldPermissions {
  permissions: {
    deployment: DeploymentPermission
    streaming: StreamingPermission
    access: AccessPermission
  }
  owner: string
  summary: Record<string, unknown>
}

interface ParcelOperators {
  owner: string
  operator: string | null
  updateOperator: string | null
  updateManagers: string[]
  approvedForAll: string[]
}

export type { AccessPermission, DeploymentPermission, ParcelOperators, StreamingPermission, WorldPermissions }
