import { isEmptyString, isNullOrEmptyString, isString, normalizeEmail, normalizePhone } from './strings.utils';

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

describe('normalizeEmail', () => {
  it('should return normalized email for valid string', () => {
    expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    expect(normalizeEmail('User@Domain.Co.Uk')).toBe('user@domain.co.uk');
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
    expect(normalizeEmail('john.doe@gmail.com')).toBe('john.doe@gmail.com');
    expect(normalizeEmail('JOHN.DOE+test@GMAIL.COM')).toBe('john.doe+test@gmail.com');
  });

  it('should return null for empty string', () => {
    expect(normalizeEmail('')).toBe(null);
  });

  it('should return null for whitespace only', () => {
    expect(normalizeEmail('   ')).toBe(null);
    expect(normalizeEmail('\t')).toBe(null);
    expect(normalizeEmail('\n')).toBe(null);
    expect(normalizeEmail('\r')).toBe(null);
  });

  it('should return null for null value', () => {
    expect(normalizeEmail(null)).toBe(null);
  });

  it('should return null for undefined value', () => {
    expect(normalizeEmail(undefined)).toBe(null);
  });

  it('should return null for non-string value', () => {
    expect(normalizeEmail(123)).toBe(null);
    expect(normalizeEmail(new Date())).toBe(null);
    expect(normalizeEmail({})).toBe(null);
    expect(normalizeEmail([])).toBe(null);
    expect(normalizeEmail(true)).toBe(null);
    expect(normalizeEmail(false)).toBe(null);
  });
});

describe('normalizePhone', () => {
  it('should return normalized phone for valid string', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    expect(normalizePhone('555-123-4567')).toBe('5551234567');
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567');
    expect(normalizePhone('555 123 4567')).toBe('5551234567');
    expect(normalizePhone('555.123.4567')).toBe('555.123.4567');
    expect(normalizePhone('+48 123 456 789')).toBe('+48123456789');
    expect(normalizePhone('+48-123-456-789')).toBe('+48123456789');
    expect(normalizePhone('+48(123)456789')).toBe('+48123456789');
  });

  it('should return trimmed phone for string without special characters', () => {
    expect(normalizePhone('1234567890')).toBe('1234567890');
    expect(normalizePhone('  1234567890  ')).toBe('1234567890');
    expect(normalizePhone('+1234567890')).toBe('+1234567890');
  });

  it('should return null for empty string', () => {
    expect(normalizePhone('')).toBe(null);
  });

  it('should return null for whitespace only', () => {
    expect(normalizePhone('   ')).toBe(null);
    expect(normalizePhone('\t')).toBe(null);
    expect(normalizePhone('\n')).toBe(null);
    expect(normalizePhone('\r')).toBe(null);
  });

  it('should return empty string for string with only special characters', () => {
    expect(normalizePhone('---')).toBe('');
    expect(normalizePhone('()')).toBe('');
    expect(normalizePhone(' - ( ) ')).toBe('');
  });

  it('should return null for null value', () => {
    expect(normalizePhone(null)).toBe(null);
  });

  it('should return null for undefined value', () => {
    expect(normalizePhone(undefined)).toBe(null);
  });

  it('should return null for non-string value', () => {
    expect(normalizePhone(123)).toBe(null);
    expect(normalizePhone(new Date())).toBe(null);
    expect(normalizePhone({})).toBe(null);
    expect(normalizePhone([])).toBe(null);
    expect(normalizePhone(true)).toBe(null);
    expect(normalizePhone(false)).toBe(null);
  });
});
