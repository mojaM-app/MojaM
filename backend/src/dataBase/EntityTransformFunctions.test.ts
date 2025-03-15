import { EntityTransformFunctions } from './EntityTransformFunctions';

describe('EntityTransformFunctions', () => {
  test('anyToAny should return the same value', () => {
    expect(EntityTransformFunctions.anyToAny('test')).toBe('test');
    expect(EntityTransformFunctions.anyToAny(123)).toBe(123);
    expect(EntityTransformFunctions.anyToAny(null)).toBe(null);
    expect(EntityTransformFunctions.anyToAny(undefined)).toBe(undefined);
    expect(EntityTransformFunctions.anyToAny(true)).toBe(true);
    expect(EntityTransformFunctions.anyToAny(1.99999)).toBe(1.99999);
  });

  test('anyToNumber should convert string to number', () => {
    expect(EntityTransformFunctions.anyToNumber('123')).toBe(123);
    expect(EntityTransformFunctions.anyToNumber('abc')).toBe(0);
    expect(EntityTransformFunctions.anyToNumber('')).toBe(0);
    expect(EntityTransformFunctions.anyToNumber(123)).toBe(123);
    expect(EntityTransformFunctions.anyToNumber(null)).toBe(0);
    expect(EntityTransformFunctions.anyToNumber(undefined)).toBe(0);
    expect(EntityTransformFunctions.anyToNumber(true)).toBe(0);
    expect(EntityTransformFunctions.anyToNumber(1.99999)).toBe(1.99999);
  });

  test('anyToNumberOrNull should convert string to number', () => {
    expect(EntityTransformFunctions.anyToNumberOrNull('123')).toBe(123);
    expect(EntityTransformFunctions.anyToNumberOrNull('abc')).toBe(null);
    expect(EntityTransformFunctions.anyToNumberOrNull('')).toBe(null);
    expect(EntityTransformFunctions.anyToNumberOrNull(123)).toBe(123);
    expect(EntityTransformFunctions.anyToNumberOrNull(null)).toBe(null);
    expect(EntityTransformFunctions.anyToNumberOrNull(undefined)).toBe(null);
    expect(EntityTransformFunctions.anyToNumberOrNull(true)).toBe(null);
    expect(EntityTransformFunctions.anyToNumberOrNull(1.99999)).toBe(1.99999);
  });

  test('stringDateToDate should convert string to Date', () => {
    expect(EntityTransformFunctions.stringDateToDate('2025-03-15')).toEqual(new Date('2025-03-15T00:00:00Z'));
    expect(EntityTransformFunctions.stringDateToDate('')).toBeNull();
    expect(EntityTransformFunctions.stringDateToDate(undefined)).toBeNull();
  });

  test('dateToStringDate should convert Date to string', () => {
    expect(EntityTransformFunctions.dateToStringDate(new Date('2025-03-15T00:00:00Z'))).toBe('2025-03-15');
    expect(EntityTransformFunctions.dateToStringDate(null)).toBeNull();
    expect(EntityTransformFunctions.dateToStringDate(new Date('invalid date'))).toBeNull();
  });

  test('anyToBoolean should convert value to boolean', () => {
    expect(EntityTransformFunctions.anyToBoolean(1)).toBe(true);
    expect(EntityTransformFunctions.anyToBoolean('1')).toBe(true);
    expect(EntityTransformFunctions.anyToBoolean('true')).toBe(true);
    expect(EntityTransformFunctions.anyToBoolean(true)).toBe(true);
    expect(EntityTransformFunctions.anyToBoolean(0)).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean('0')).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean('false')).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean(false)).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean(null)).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean(undefined)).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean('text')).toBe(false);
    expect(EntityTransformFunctions.anyToBoolean(new Date())).toBe(false);
  });
});
