import { getAdminLoginData } from '@utils/tests.utils';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
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
    it('should return a hashed password', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword = cryptoService.hashPassword(salt, password);
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBe(128);
    });

    it('should return same hashed password', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();
      const hashedPassword1 = cryptoService.hashPassword(salt, password);
      const hashedPassword2 = cryptoService.hashPassword(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);
    });
  });

  describe('passwordMatches', () => {
    it('should return TRUE when password matches', () => {
      const salt = cryptoService.generateSalt();
      const { password } = getAdminLoginData();

      expect(salt.length).toBeGreaterThan(0);

      const hashedPassword1 = cryptoService.hashPassword(salt, password);
      const hashedPassword2 = cryptoService.hashPassword(salt, password);
      expect(hashedPassword2).toEqual(hashedPassword1);

      const passwordMatches = cryptoService.passwordMatches(password, salt, hashedPassword1);
      expect(passwordMatches).toBe(true);
    });

    it('should return FALSE when password NOT matches', () => {
      const salt = cryptoService.generateSalt();

      const password1 = 'password123';
      const hashedPassword1 = cryptoService.hashPassword(salt, password1);

      const password2 = 'password1234';
      const hashedPassword2 = cryptoService.hashPassword(salt, password2);

      expect(hashedPassword2).not.toEqual(hashedPassword1);

      let passwordMatches = cryptoService.passwordMatches(password2, salt, hashedPassword1);
      expect(passwordMatches).toBe(false);
      passwordMatches = cryptoService.passwordMatches(password1, salt, hashedPassword2);
      expect(passwordMatches).toBe(false);
    });
  });
});
