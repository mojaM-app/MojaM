import { toBoolean } from './boolean.utils';

describe('toBoolean', () => {
  it('should return true for 1', () => {
    expect(toBoolean(1)).toBe(true);
  });

  it('should return true for true', () => {
    expect(toBoolean(true)).toBe(true);
  });

  it("should return true for 'true'", () => {
    expect(toBoolean('true')).toBe(true);
  });

  it("should return true for '1'", () => {
    expect(toBoolean('1')).toBe(true);
  });

  it('should return false for 0', () => {
    expect(toBoolean(0)).toBe(false);
  });

  it('should return false for false', () => {
    expect(toBoolean(false)).toBe(false);
  });

  it("should return false for 'false'", () => {
    expect(toBoolean('false')).toBe(false);
  });

  it("should return false for '0'", () => {
    expect(toBoolean('0')).toBe(false);
  });

  it('should return false for null', () => {
    expect(toBoolean(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(toBoolean(undefined)).toBe(false);
  });

  it("should return false for ''", () => {
    expect(toBoolean('')).toBe(false);
  });

  it('should return false for any other value', () => {
    expect(toBoolean('random')).toBe(false);
    expect(toBoolean(123)).toBe(false);
    expect(toBoolean({})).toBe(false);
    expect(toBoolean([])).toBe(false);
  });

  it('should return false for case-sensitive variants of true', () => {
    expect(toBoolean('True')).toBe(false);
    expect(toBoolean('TRUE')).toBe(false);
  });

  it('should return false for whitespace-padded strings', () => {
    expect(toBoolean(' true')).toBe(false);
    expect(toBoolean('true ')).toBe(false);
    expect(toBoolean(' 1')).toBe(false);
    expect(toBoolean('1 ')).toBe(false);
  });

  it('should return false for boolean-like objects', () => {
    expect(toBoolean(new Boolean(true))).toBe(false);
    expect(toBoolean(Boolean(1))).toBe(true); // This will be coerced to primitive true
  });

  it('should return false for numeric values other than 1', () => {
    expect(toBoolean(2)).toBe(false);
    expect(toBoolean(-1)).toBe(false);
    expect(toBoolean(1.1)).toBe(false);
  });
});
