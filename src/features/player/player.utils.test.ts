import { describe, expect, it } from 'vitest'
import { getDisplayName, truncateAddress } from './player.utils'

describe('getDisplayName', () => {
  describe('when the avatar has a claimed name', () => {
    it('should return the name as-is', () => {
      const avatar = { name: 'Gabriel', hasClaimedName: true }
      expect(getDisplayName(avatar, '0x1234567890abcdef1234567890abcdef12345678')).toBe('Gabriel')
    })
  })

  describe('when the avatar has not claimed a name', () => {
    describe('and the name already ends with the address suffix', () => {
      it('should return the name as-is', () => {
        const avatar = { name: 'Guest#5678', hasClaimedName: false }
        expect(getDisplayName(avatar, '0x1234567890abcdef1234567890abcdef12345678')).toBe('Guest#5678')
      })
    })

    describe('and the name does not end with the address suffix', () => {
      it('should append the address suffix', () => {
        const avatar = { name: 'Guest', hasClaimedName: false }
        expect(getDisplayName(avatar, '0x1234567890abcdef1234567890abcdef12345678')).toBe('Guest#5678')
      })
    })
  })

  describe('when the address is empty', () => {
    it('should return the name as-is', () => {
      const avatar = { name: 'Guest', hasClaimedName: false }
      expect(getDisplayName(avatar, '')).toBe('Guest')
    })
  })
})

describe('truncateAddress', () => {
  describe('when the address is long', () => {
    it('should truncate with ellipsis', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678')
    })
  })

  describe('when the address is short', () => {
    it('should return it as-is', () => {
      expect(truncateAddress('0x123456')).toBe('0x123456')
    })
  })
})
