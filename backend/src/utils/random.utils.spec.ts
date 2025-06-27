import {
  generateRandomDate,
  generateRandomEmail,
  generateRandomInteger,
  generateRandomNumber,
  generateRandomPassword,
  generateRandomString,
  getRandomCharFromString,
} from './random.utils';

describe('random.utils', () => {
  describe('getRandomCharFromString', () => {
    it('should return a character from the string', () => {
      const testString = 'abc';
      const result = getRandomCharFromString(testString);
      expect(testString).toContain(result);
      expect(result.length).toBe(1);
    });

    it('should return empty string when input is empty', () => {
      const result = getRandomCharFromString('');
      expect(result).toBe('');
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with default length 10', () => {
      const password = generateRandomPassword();
      expect(password.length).toBe(10);
    });

    it('should generate password with custom length', () => {
      const password = generateRandomPassword(15);
      expect(password.length).toBe(15);
    });

    it('should contain at least one uppercase letter', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[A-Z]/);
    });

    it('should contain at least one lowercase letter', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[a-z]/);
    });

    it('should contain at least one number', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[0-9]/);
    });

    it('should contain at least one symbol', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[!@#$%^&*]/);
    });
  });
  describe('generateRandomString', () => {
    it('should generate string with default length 8 + 1 number', () => {
      const randomString = generateRandomString();
      expect(randomString.length).toBe(9); // 8 lowercase + 1 number
    });

    it('should generate string with custom length + 1 number', () => {
      const randomString = generateRandomString(12);
      expect(randomString.length).toBe(13); // 12 lowercase + 1 number
    });

    it('should start with lowercase letter', () => {
      const randomString = generateRandomString();
      expect(randomString[0]).toMatch(/[a-z]/);
    });

    it('should end with number', () => {
      const randomString = generateRandomString();
      expect(randomString[randomString.length - 1]).toMatch(/[0-9]/);
    });

    it('should contain only lowercase letters and numbers', () => {
      const randomString = generateRandomString();
      expect(randomString).toMatch(/^[a-z]+[0-9]$/);
    });

    it('should have correct structure for different lengths', () => {
      const shortString = generateRandomString(3);
      expect(shortString.length).toBe(4); // 3 lowercase + 1 number
      expect(shortString).toMatch(/^[a-z]{3}[0-9]$/);

      const longString = generateRandomString(10);
      expect(longString.length).toBe(11); // 10 lowercase + 1 number
      expect(longString).toMatch(/^[a-z]{10}[0-9]$/);
    });
  });
  describe('generateRandomEmail', () => {
    it('should generate email with default length', () => {
      const email = generateRandomEmail();
      expect(email.length).toBe(19); // 8 lowercase + 1 number + '@email.com' = 19
      expect(email).toMatch(/^[a-z]+[0-9]@email\.com$/);
    });

    it('should generate email with custom length', () => {
      const email = generateRandomEmail(10);
      expect(email.length).toBe(21); // 10 lowercase + 1 number + '@email.com' = 21
      expect(email).toMatch(/^[a-z]+[0-9]@email\.com$/);
    });

    it('should end with @email.com', () => {
      const email = generateRandomEmail();
      expect(email.endsWith('@email.com')).toBe(true);
    });

    it('should have valid email structure', () => {
      const email = generateRandomEmail(5);
      expect(email.length).toBe(16); // 5 lowercase + 1 number + '@email.com' = 16
      expect(email).toContain('@');
      expect(email.split('@')[0].length).toBe(6); // 5 + 1 number
      expect(email.split('@')[1]).toBe('email.com');
    });
  });

  describe('generateRandomNumber', () => {
    it('should generate number string with default length 9', () => {
      const number = generateRandomNumber();
      expect(number.length).toBe(9);
      expect(number).toMatch(/^[0-9]+$/);
    });

    it('should generate number string with custom length', () => {
      const number = generateRandomNumber(5);
      expect(number.length).toBe(5);
      expect(number).toMatch(/^[0-9]+$/);
    });

    it('should contain only digits', () => {
      const number = generateRandomNumber();
      expect(number).toMatch(/^[0-9]+$/);
    });
  });

  describe('generateRandomInteger', () => {
    it('should generate integer within range', () => {
      const min = 1;
      const max = 10;
      const result = generateRandomInteger(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle single value range', () => {
      const result = generateRandomInteger(5, 5);
      expect(result).toBe(5);
    });

    it('should handle negative ranges', () => {
      const min = -10;
      const max = -5;
      const result = generateRandomInteger(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });

    it('should handle zero values', () => {
      const result = generateRandomInteger(0, 0);
      expect(result).toBe(0);
    });
  });

  describe('generateRandomDate', () => {
    it('should generate valid Date object', () => {
      const result = generateRandomDate();
      expect(result).toBeInstanceOf(Date);
      expect(result.toString()).not.toBe('Invalid Date');
    });
  });
});
