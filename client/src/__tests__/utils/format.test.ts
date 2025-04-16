import { formatDate } from '@/utils/format'

describe('format utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(formatDate(date)).toBe('2024-01-01')
    })

    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })
  })
}) 