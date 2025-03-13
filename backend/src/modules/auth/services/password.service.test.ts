/* eslint-disable */
import { VALIDATOR_SETTINGS } from '@config';
import { getAdminLoginData } from '@utils/tests.utils';
import { CryptoService } from './crypto.service';
import { PasswordService } from './password.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let passwordService: PasswordService;

  beforeEach(() => {
    cryptoService = new CryptoService();
    passwordService = new PasswordService();
  });

  describe('generateSalt', () => {
    it('should return a salt', () => {
      const salt = cryptoService.generateSalt();
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32);
    });

    it('should return random salt', () => {
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('hashPassword', () => {
    it('should throw an error when salt is not set', () => {
      const { password } = getAdminLoginData();
      expect(() => passwordService.hashPassword(null as any, password)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.hashPassword(undefined as any, password)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.hashPassword('', password)).toThrow('Salt and password are required to hash a password');
    });

    it('should throw an error when password is not set', () => {
      const salt = cryptoService.generateSalt();
      expect(() => passwordService.hashPassword(salt, null as any)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.hashPassword(salt, undefined as any)).toThrow('Salt and password are required to hash a password');
      expect(() => passwordService.hashPassword(salt, '')).toThrow('Salt and password are required to hash a password');
    });

    it('should return a hashed password', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword = passwordService.hashPassword(salt, password);
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBe(128);
    });

    it('should return same hashed password', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword1 = passwordService.hashPassword(salt, password);
      const hashedPassword2 = passwordService.hashPassword(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);
    });

    it('should return different hashed password', () => {
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword1 = passwordService.hashPassword(salt1, password);
      const hashedPassword2 = passwordService.hashPassword(salt2, password);
      expect(hashedPassword2).not.toEqual(hashedPassword1);
    });
  });

  describe('passwordMatches', () => {
    it('should return TRUE when password matches', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();

      expect(salt.length).toBeGreaterThan(0);

      const hashedPassword1 = passwordService.hashPassword(salt, password);
      const hashedPassword2 = passwordService.hashPassword(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);

      const passwordMatches = passwordService.passwordMatches(password, salt, hashedPassword1);
      expect(passwordMatches).toBe(true);
    });

    it('should return FALSE when password NOT matches', () => {
      const salt = cryptoService.generateSalt();

      const password1 = 'password123';
      const hashedPassword1 = passwordService.hashPassword(salt, password1);

      const password2 = 'password1234';
      const hashedPassword2 = passwordService.hashPassword(salt, password2);

      expect(hashedPassword2).not.toEqual(hashedPassword1);

      let passwordMatches = passwordService.passwordMatches(password2, salt, hashedPassword1);
      expect(passwordMatches).toBe(false);
      passwordMatches = passwordService.passwordMatches(password1, salt, hashedPassword2);
      expect(passwordMatches).toBe(false);
    });
  });

  describe('isPasswordValid', () => {
    it('should return false when password is null or undefined', () => {
      expect(passwordService.isPasswordValid(null)).toBe(false);
      expect(passwordService.isPasswordValid(undefined)).toBe(false);
    });

    it('should return false when password is an empty string', () => {
      expect(passwordService.isPasswordValid('')).toBe(false);
    });

    it('should return false when password exceeds max length', () => {
      const longPassword = 'a'.repeat(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH + 1);
      expect(passwordService.isPasswordValid(longPassword)).toBe(false);
    });

    it('should return false when password is not strong', () => {
      const weakPassword = 'password';
      expect(passwordService.isPasswordValid(weakPassword)).toBe(false);
    });

    it('should return true when password is valid', () => {
      const strongPassword = 'Str0ngP@ssw0rd!';
      expect(passwordService.isPasswordValid(strongPassword)).toBe(true);
    });
  });
});
