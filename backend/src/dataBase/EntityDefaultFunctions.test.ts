import { EntityDefaultFunctions } from './EntityDefaultFunctions';

describe('EntityDefaultFunctions', () => {
  describe('defaultCurrentTimestampPrecision0', () => {
    it('should return CURRENT_TIMESTAMP', () => {
      expect(EntityDefaultFunctions.defaultCurrentTimestampPrecision0()).toBe('CURRENT_TIMESTAMP');
    });
  });

  describe('defaultCurrentTimestampPrecision3', () => {
    it('should return CURRENT_TIMESTAMP(3)', () => {
      expect(EntityDefaultFunctions.defaultCurrentTimestampPrecision3()).toBe('CURRENT_TIMESTAMP(3)');
    });
  });
});
