import { isEmptyString, isNullOrEmptyString, isString } from './strings.utils';

describe('isNullOrEmptyString', () => {
  it('should return true for empty string', () => {
    expect(isNullOrEmptyString('')).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isNullOrEmptyString('\n')).toBe(false);
    expect(isNullOrEmptyString('\r')).toBe(false);
    expect(isNullOrEmptyString('\t')).toBe(false);
    expect(isNullOrEmptyString(' ')).toBe(false);
    expect(isNullOrEmptyString('Hello, world!')).toBe(false);
    expect(isNullOrEmptyString(' Hello, world!')).toBe(false);
    expect(isNullOrEmptyString(' Hello, world! ')).toBe(false);
    expect(isNullOrEmptyString('Hello, world! ')).toBe(false);
    expect(isNullOrEmptyString('0')).toBe(false);
    expect(isNullOrEmptyString('false')).toBe(false);
    expect(isNullOrEmptyString('true')).toBe(false);
  });

  it('should return true for null value', () => {
    expect(isNullOrEmptyString(null)).toBe(true);
  });

  it('should return true for undefined value', () => {
    expect(isNullOrEmptyString(undefined)).toBe(true);
  });

  it('should return false for non-string value', () => {
    expect(isNullOrEmptyString(123)).toBe(false);
    expect(isNullOrEmptyString(new Date())).toBe(false);
    expect(isNullOrEmptyString(new String())).toBe(false);
    expect(isNullOrEmptyString(new Number())).toBe(false);
    expect(isNullOrEmptyString(new Number(1))).toBe(false);
    expect(isNullOrEmptyString(new Number(-1))).toBe(false);
    expect(isNullOrEmptyString({})).toBe(false);
    expect(isNullOrEmptyString([])).toBe(false);
    expect(isNullOrEmptyString(() => {})).toBe(false);
    expect(
      isNullOrEmptyString(() => {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isNullOrEmptyString(function () {})).toBe(false);
    expect(
      isNullOrEmptyString(function () {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isNullOrEmptyString(true)).toBe(false);
    expect(isNullOrEmptyString(false)).toBe(false);
  });
});

describe('isString', () => {
  it('should return true for string value', () => {
    expect(isString('Hello, world!')).toBe(true);
    expect(isString('')).toBe(true);
    expect(isString(' ')).toBe(true);
    expect(isString('\n')).toBe(true);
    expect(isString('\r')).toBe(true);
    expect(isString('\t')).toBe(true);
    expect(isString('0')).toBe(true);
    expect(isString('false')).toBe(true);
    expect(isString('true')).toBe(true);
  });

  it('should return false for non-string value', () => {
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(123)).toBe(false);
    expect(isString(new Date())).toBe(false);
    expect(isString(new String())).toBe(false);
    expect(isString(new Number())).toBe(false);
    expect(isString(new Number(1))).toBe(false);
    expect(isString(new Number(-1))).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(() => {})).toBe(false);
    expect(
      isString(() => {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isString(function () {})).toBe(false);
    expect(
      isString(function () {
        return 'hello, world!';
      }),
    ).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(false)).toBe(false);
  });
});

describe('isEmptyString', () => {
  it('should return true for empty string', () => {
    expect(isEmptyString('')).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isEmptyString('\n')).toBe(false);
    expect(isEmptyString('\r')).toBe(false);
    expect(isEmptyString('\t')).toBe(false);
    expect(isEmptyString(' ')).toBe(false);
    expect(isEmptyString('Hello, world!')).toBe(false);
    expect(isEmptyString(' Hello, world!')).toBe(false);
    expect(isEmptyString(' Hello, world! ')).toBe(false);
    expect(isEmptyString('Hello, world! ')).toBe(false);
  });

  it('should return false for null value', () => {
    expect(isEmptyString(null)).toBe(false);
  });

  it('should return false for undefined value', () => {
    expect(isEmptyString(undefined)).toBe(false);
  });

  it('should return false for non-string value', () => {
    expect(isEmptyString(123)).toBe(false);
    expect(isEmptyString(new Date())).toBe(false);
    expect(isEmptyString(new String())).toBe(false);
    expect(isEmptyString(new Number())).toBe(false);
    expect(isEmptyString({})).toBe(false);
    expect(isEmptyString([])).toBe(false);
    expect(isEmptyString(() => {})).toBe(false);
    expect(isEmptyString(true)).toBe(false);
    expect(isEmptyString(false)).toBe(false);
  });
});
