import { CacheError } from '../../types/errors';
import { CacheService } from '../CacheService';

describe('CacheService', () => {
  beforeEach(() => {
    CacheService.clear();
  });

  describe('get and set', () => {
    it('should store and retrieve data', () => {
      const data = { test: 'value' };
      CacheService.set('test', data);
      const retrieved = CacheService.get('test');
      expect(retrieved).toEqual(data);
    });

    it('should handle TTL expiration', () => {
      const data = { test: 'value' };
      CacheService.set('test', data, 100); // 100ms TTL

      // Data should be available immediately
      expect(CacheService.get('test')).toEqual(data);

      // Wait for TTL to expire
      jest.advanceTimersByTime(150);

      // Data should be expired
      expect(CacheService.get('test')).toBeNull();
    });

    it('should compress large data', () => {
      const largeData = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB
      CacheService.set('large', largeData);
      const retrieved = CacheService.get('large');
      expect(retrieved).toEqual(largeData);
    });

    it('should handle different data types', () => {
      const types = {
        string: 'test',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { a: 1, b: 2 },
      };

      Object.entries(types).forEach(([key, value]) => {
        CacheService.set(key, value);
        expect(CacheService.get(key)).toEqual(value);
      });
    });
  });

  describe('remove and clear', () => {
    it('should remove specific key', () => {
      CacheService.set('test1', 'value1');
      CacheService.set('test2', 'value2');

      CacheService.remove('test1');

      expect(CacheService.get('test1')).toBeNull();
      expect(CacheService.get('test2')).toEqual('value2');
    });

    it('should clear all data', () => {
      CacheService.set('test1', 'value1');
      CacheService.set('test2', 'value2');

      CacheService.clear();

      expect(CacheService.get('test1')).toBeNull();
      expect(CacheService.get('test2')).toBeNull();
    });
  });

  describe('getKeys', () => {
    it('should return all cache keys', () => {
      CacheService.set('test1', 'value1');
      CacheService.set('test2', 'value2');

      const keys = CacheService.getKeys();

      expect(keys).toContain('test1');
      expect(keys).toContain('test2');
      expect(keys.length).toBe(2);
    });

    it('should return empty array when cache is empty', () => {
      expect(CacheService.getKeys()).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => CacheService.set('test', 'value')).toThrow(CacheError);

      // Restore original implementation
      localStorage.setItem = originalSetItem;
    });

    it('should handle invalid JSON', () => {
      // Mock localStorage to return invalid JSON
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockReturnValue('invalid json');

      expect(CacheService.get('test')).toBeNull();

      // Restore original implementation
      localStorage.getItem = originalGetItem;
    });
  });
});
