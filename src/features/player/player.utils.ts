/**
 * Builds a display name for a Decentraland profile.
 *
 * - Claimed names are shown as-is (e.g. "Gabriel").
 * - Unclaimed names get a `#XXXX` suffix (last 4 chars of address) for disambiguation,
 *   unless the name already ends with that suffix.
 */
const getDisplayName = (avatar: { name: string; hasClaimedName: boolean }, address: string): string => {
  if (avatar.hasClaimedName) {
    return avatar.name
  }

  const lastPart = address ? `#${address.slice(-4)}` : ''
  return avatar.name.endsWith(lastPart) ? avatar.name : avatar.name + lastPart
}

/**
 * Truncates an Ethereum address for display: `0x1234...5678`
 */
const truncateAddress = (address: string): string => {
  if (address.length <= 10) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export { getDisplayName, truncateAddress }
