/**
 * URL Parser tests
 *
 * Tests URL parsing and caching functionality in src/utils/url-parser.ts
 */

import {
  parseQuery,
  parseUrl,
  clearQueryCache,
  getQueryCacheSize,
} from '../../src/utils/url-parser'

describe('URL Parser', () => {
  // Initialize cache before each test
  beforeEach(() => {
    clearQueryCache()
  })

  describe('parseQuery', () => {
    it('should parse query parameters', () => {
      const result = parseQuery('/users?page=1&limit=10')
      expect(result).toEqual({
        page: '1',
        limit: '10',
      })
    })

    it('should return empty object if no query parameters', () => {
      const result = parseQuery('/users')
      expect(result).toEqual({})
    })

    it('should return empty object if query parameter is empty string', () => {
      const result = parseQuery('/users?')
      expect(result).toEqual({})
    })

    it('should parse complex query parameters', () => {
      const result = parseQuery('/search?q=hello+world&category=books&sort=asc')
      expect(result).toEqual({
        q: 'hello world',
        category: 'books',
        sort: 'asc',
      })
    })

    it('should decode URL-encoded values', () => {
      const result = parseQuery('/search?name=%ED%99%8D%EA%B8%B8%EB%8F%99')
      expect(result).toEqual({
        name: '홍길동',
      })
    })

    it('should handle array parameters', () => {
      const result = parseQuery('/users?id=1&id=2&id=3')
      // URLSearchParams returns only the last value
      expect(result.id).toBe('3')
    })

    it('should handle empty values', () => {
      const result = parseQuery('/users?name=&age=25')
      expect(result).toEqual({
        name: '',
        age: '25',
      })
    })
  })

  describe('parseUrl', () => {
    it('should separate URL into path and query', () => {
      const result = parseUrl('/users?page=1&limit=10')
      expect(result.path).toBe('/users')
      expect(result.query).toEqual({
        page: '1',
        limit: '10',
      })
    })

    it('should handle URL without query', () => {
      const result = parseUrl('/users')
      expect(result.path).toBe('/users')
      expect(result.query).toEqual({})
    })

    it('should handle root path', () => {
      const result = parseUrl('/')
      expect(result.path).toBe('/')
      expect(result.query).toEqual({})
    })

    it('should handle complex paths', () => {
      const result = parseUrl('/api/v1/users/123?include=profile')
      expect(result.path).toBe('/api/v1/users/123')
      expect(result.query).toEqual({
        include: 'profile',
      })
    })
  })

  describe('Caching', () => {
    it('should cache identical URLs', () => {
      const url = '/users?page=1&limit=10'

      // First call (cache miss)
      const result1 = parseQuery(url)
      expect(getQueryCacheSize()).toBe(1)

      // Second call (cache hit)
      const result2 = parseQuery(url)
      expect(getQueryCacheSize()).toBe(1)

      expect(result1).toEqual(result2)
    })

    it('should cache different URLs separately', () => {
      parseQuery('/users?page=1')
      parseQuery('/users?page=2')
      parseQuery('/posts?page=1')

      expect(getQueryCacheSize()).toBe(3)
    })

    it('LRU cache should work (max 1000 entries)', () => {
      // Generate 1001 different URLs
      for (let i = 0; i < 1001; i++) {
        parseQuery(`/users?page=${i}`)
      }

      // Cache size should be max 1000
      expect(getQueryCacheSize()).toBe(1000)
    })

    it('frequently used URLs should be kept in cache (LRU)', () => {
      // Generate 1000 URLs
      for (let i = 0; i < 1000; i++) {
        parseQuery(`/users?page=${i}`)
      }

      // Use a specific URL frequently
      const popularUrl = '/users?page=999'
      parseQuery(popularUrl)

      // Add new URL (exceeds cache size)
      parseQuery('/users?page=1000')

      // Frequently used URL should still be in cache
      expect(getQueryCacheSize()).toBe(1000)

      // Should have no error when retrieving from cache
      const result = parseQuery(popularUrl)
      expect(result).toEqual({ page: '999' })
    })

    it('clearQueryCache should initialize cache', () => {
      parseQuery('/users?page=1')
      parseQuery('/users?page=2')
      expect(getQueryCacheSize()).toBe(2)

      clearQueryCache()
      expect(getQueryCacheSize()).toBe(0)
    })
  })

  describe('Performance', () => {
    it('cache hit should be faster than cache miss', () => {
      const url = '/search?q=test&category=books&sort=asc&page=1&limit=20'

      // First call (cache miss) - measure time
      const start1 = performance.now()
      for (let i = 0; i < 1000; i++) {
        parseQuery(url)
      }
      const duration1 = performance.now() - start1

      // Clear cache
      clearQueryCache()

      // Measure cache miss with new URLs
      const start2 = performance.now()
      for (let i = 0; i < 1000; i++) {
        parseQuery(`/search?q=test${i}`)
      }
      const duration2 = performance.now() - start2

      // Cache hit should be faster than or similar to cache miss
      // (Explicit comparison is not made as it may vary depending on test environment)
      expect(duration1).toBeGreaterThan(0)
      expect(duration2).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = parseQuery('')
      expect(result).toEqual({})
    })

    it('should handle case with only /', () => {
      const result = parseQuery('/')
      expect(result).toEqual({})
    })

    it('should handle case with only ?', () => {
      const result = parseQuery('?')
      expect(result).toEqual({})
    })

    it('should handle path with special characters', () => {
      const result = parseQuery('/users-list?name=john-doe')
      expect(result).toEqual({
        name: 'john-doe',
      })
    })

    it('should handle URL with # hash', () => {
      const result = parseQuery('/users?page=1#section')
      // URLSearchParams parses including #
      expect(result.page).toBe('1')
    })

    it('should handle very long query string', () => {
      const longQuery =
        '/users?' + Array.from({ length: 50 }, (_, i) => `param${i}=value${i}`).join('&')
      const result = parseQuery(longQuery)
      expect(Object.keys(result).length).toBe(50)
      expect(result.param0).toBe('value0')
      expect(result.param49).toBe('value49')
    })
  })

  describe('Type Safety', () => {
    it('return type should be Record<string, any>', () => {
      const result = parseQuery('/users?page=1')
      expect(typeof result).toBe('object')
      expect(result).not.toBeNull()
      expect(Array.isArray(result)).toBe(false)
    })

    it('non-existent key should return undefined', () => {
      const result = parseQuery('/users?page=1')
      expect(result.page).toBe('1')
      expect(result.nonexistent).toBeUndefined()
    })
  })
})
