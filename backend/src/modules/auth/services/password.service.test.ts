/* eslint-disable */
import { VALIDATOR_SETTINGS } from '@config';
import { generateRandomPassword, getAdminLoginData } from '@utils/tests.utils';
import { CryptoService } from './crypto.service';
import { PasswordService } from './password.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let passwordService: PasswordService;

  beforeEach(() => {
    cryptoService = new CryptoService();
    passwordService = new PasswordService();
  });

  describe('getHash', () => {
    it('should throw an error when salt is not set', () => {
      const { password } = getAdminLoginData();
      expect(() => passwordService.getHash(null as any, password)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.getHash(undefined as any, password)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.getHash('', password)).toThrow('Salt and password are required to hash a password');
    });

    it('should throw an error when password is not set', () => {
      const salt = cryptoService.generateSalt();
      expect(() => passwordService.getHash(salt, null as any)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.getHash(salt, undefined as any)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.getHash(salt, '')).toThrow('Salt and password are required to hash a password');
    });

    it('should return a hashed password', () => {
      const salt = cryptoService.generateSalt();
      const hashedPassword = passwordService.getHash(salt, generateRandomPassword(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH));
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBe(128);
    });

    it('should return same hashed password', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword1 = passwordService.getHash(salt, password);
      const hashedPassword2 = passwordService.getHash(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);
    });

    it('should return different hashed password', () => {
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword1 = passwordService.getHash(salt1, password);
      const hashedPassword2 = passwordService.getHash(salt2, password);
      expect(hashedPassword2).not.toEqual(hashedPassword1);
    });
  });

  describe('match', () => {
    it('should return TRUE when password matches', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();

      expect(salt.length).toBeGreaterThan(0);

      const hashedPassword1 = passwordService.getHash(salt, password);
      const hashedPassword2 = passwordService.getHash(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);

      const passwordMatches = passwordService.match(password, salt, hashedPassword1);
      expect(passwordMatches).toBe(true);
    });

    it('should return FALSE when password NOT matches', () => {
      const salt = cryptoService.generateSalt();

      const password1 = 'password123';
      const hashedPassword1 = passwordService.getHash(salt, password1);

      const password2 = 'password1234';
      const hashedPassword2 = passwordService.getHash(salt, password2);

      expect(hashedPassword2).not.toEqual(hashedPassword1);

      let passwordMatches = passwordService.match(password2, salt, hashedPassword1);
      expect(passwordMatches).toBe(false);
      passwordMatches = passwordService.match(password1, salt, hashedPassword2);
      expect(passwordMatches).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return false when password is null or undefined', () => {
      expect(passwordService.isValid(null)).toBe(false);
      expect(passwordService.isValid(undefined)).toBe(false);
    });

    it('should return false when password is an empty string', () => {
      expect(passwordService.isValid('')).toBe(false);
    });

    it('should return false when password exceeds max length', () => {
      const longPassword = generateRandomPassword(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH + 1);
      expect(passwordService.isValid(longPassword)).toBe(false);
    });

    it('should return false when password is not strong', () => {
      const weakPassword = generateRandomPassword(VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS.minLength! - 1);
      expect(passwordService.isValid(weakPassword)).toBe(false);
    });

    it('should return true when password is valid', () => {
      const strongPassword = generateRandomPassword(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH);
      expect(passwordService.isValid(strongPassword)).toBe(true);
    });
  });
});
