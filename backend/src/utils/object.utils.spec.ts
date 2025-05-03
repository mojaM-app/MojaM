import { isNullOrUndefined } from './object.utils';

describe('object utils', () => {
  describe('isNullOrUndefined function', () => {
    it('should return true for null values', () => {
      const result = isNullOrUndefined(null);
      expect(result).toBe(true);
    });

    it('should return true for undefined values', () => {
      const result = isNullOrUndefined(undefined);
      expect(result).toBe(true);
    });

    it('should return false for string values', () => {
      const result = isNullOrUndefined('test');
      expect(result).toBe(false);
    });

    it('should return false for empty string values', () => {
      const result = isNullOrUndefined('');
      expect(result).toBe(false);
    });

    it('should return false for number values', () => {
      const result = isNullOrUndefined(0);
      expect(result).toBe(false);
    });

    it('should return false for boolean values', () => {
      const result = isNullOrUndefined(false);
      expect(result).toBe(false);
    });

    it('should return false for object values', () => {
      const result = isNullOrUndefined({});
      expect(result).toBe(false);
    });

    it('should return false for array values', () => {
      const result = isNullOrUndefined([]);
      expect(result).toBe(false);
    });
  });
});
