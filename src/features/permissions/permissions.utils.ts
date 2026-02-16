import type { ParcelOperators, WorldPermissions } from './permissions.types'

/**
 * Check if a user has permission to deploy to a realm (world)
 * User has permission if they are:
 * - The owner of the realm
 * - Listed in the deployment wallets allow-list
 */
const hasRealmPermission = (permissions: WorldPermissions, userAddress: string): boolean => {
  const normalizedUser = userAddress.toLowerCase()
  const normalizedOwner = permissions.owner.toLowerCase()

  // Check if user is owner
  if (normalizedUser === normalizedOwner) {
    return true
  }

  // Check if user is in deployment wallets
  const deploymentWallets = permissions.permissions.deployment.wallets.map(w => w.toLowerCase())
  if (deploymentWallets.includes(normalizedUser)) {
    return true
  }

  return false
}

/**
 * Check if a user has permission to update a parcel
 * User has permission if they are:
 * - The owner of the parcel
 * - The operator of the parcel
 * - The updateOperator of the parcel
 * - In the approvedForAll list
 */
const hasParcelPermission = (operators: ParcelOperators, userAddress: string): boolean => {
  const normalizedUser = userAddress.toLowerCase()

  // Check if user is owner
  if (normalizedUser === operators.owner.toLowerCase()) {
    return true
  }

  // Check if user is operator
  if (operators.operator && normalizedUser === operators.operator.toLowerCase()) {
    return true
  }

  // Check if user is updateOperator
  if (operators.updateOperator && normalizedUser === operators.updateOperator.toLowerCase()) {
    return true
  }

  // Check if user is in approvedForAll
  const approvedAddresses = operators.approvedForAll.map(a => a.toLowerCase())
  if (approvedAddresses.includes(normalizedUser)) {
    return true
  }

  return false
}

export { hasParcelPermission, hasRealmPermission }
