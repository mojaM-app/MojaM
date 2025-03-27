/* eslint-disable */
import { VALIDATOR_SETTINGS } from '@config';
import { generateRandomNumber } from '@utils/tests.utils';
import { CryptoService } from './crypto.service';
import { PinService } from './pin.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let pinService: PinService;

  beforeEach(() => {
    cryptoService = new CryptoService();
    pinService = new PinService();
  });

  describe('getHash', () => {
    it('should throw an error when salt is not set', () => {
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      expect(() => pinService.getHash(null as any, pin)).toThrow('Salt and pin are required to hash a pin');
      expect(() => pinService.getHash(undefined as any, pin)).toThrow('Salt and pin are required to hash a pin');
      expect(() => pinService.getHash('', pin)).toThrow('Salt and pin are required to hash a pin');
    });

    it('should throw an error when pin is not set', () => {
      const salt = cryptoService.generateSalt();
      expect(() => pinService.getHash(salt, null as any)).toThrow('Salt and pin are required to hash a pin');
      expect(() => pinService.getHash(salt, undefined as any)).toThrow('Salt and pin are required to hash a pin');
      expect(() => pinService.getHash(salt, '')).toThrow('Salt and pin are required to hash a pin');
    });

    it('should return a hashed pin', () => {
      const salt = cryptoService.generateSalt();
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      const hashedPin = pinService.getHash(salt, pin);
      expect(hashedPin).toBeDefined();
      expect(typeof hashedPin).toBe('string');
      expect(hashedPin.length).toBe(PinService.HASH_LENGTH);
    });

    it('should return same hashed pin', () => {
      const salt = cryptoService.generateSalt();
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      const hashedPin1 = pinService.getHash(salt, pin);
      const hashedPin2 = pinService.getHash(salt, pin);
      expect(hashedPin2).toEqual(hashedPin1);
    });

    it('should return different hashed pin', () => {
      const salt1 = cryptoService.generateSalt();
      const salt2 = cryptoService.generateSalt();
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      const hashedPin1 = pinService.getHash(salt1, pin);
      const hashedPin2 = pinService.getHash(salt2, pin);
      expect(hashedPin2).not.toEqual(hashedPin1);
    });
  });

  describe('match', () => {
    it('should return TRUE when pin matches', () => {
      const salt = cryptoService.generateSalt();
      const pin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);

      expect(salt.length).toBeGreaterThan(0);

      const hashedPin1 = pinService.getHash(salt, pin);
      const hashedPin2 = pinService.getHash(salt, pin);
      expect(hashedPin2).toEqual(hashedPin1);

      const pinMatches = pinService.match(pin, salt, hashedPin1);
      expect(pinMatches).toBe(true);
    });

    it('should return FALSE when pin NOT matches', () => {
      const salt = cryptoService.generateSalt();

      const pin1 = '1234';
      const hashedPin1 = pinService.getHash(salt, pin1);

      const pin2 = '4321';
      const hashedPin2 = pinService.getHash(salt, pin2);

      expect(hashedPin2).not.toEqual(hashedPin1);

      let pinMatches = pinService.match(pin2, salt, hashedPin1);
      expect(pinMatches).toBe(false);
      pinMatches = pinService.match(pin1, salt, hashedPin2);
      expect(pinMatches).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return false when pin is null or undefined', () => {
      expect(pinService.isValid(null)).toBe(false);
      expect(pinService.isValid(undefined)).toBe(false);
    });

    it('should return false when pin is an empty string', () => {
      expect(pinService.isValid('')).toBe(false);
    });

    it('should return false when pin exceeds max length', () => {
      const longPin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH + 1);
      expect(pinService.isValid(longPin)).toBe(false);
    });

    it('should return false when pin is not strong', () => {
      const weakPin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH - 1);
      expect(pinService.isValid(weakPin)).toBe(false);
    });

    it('should return true when pin is valid', () => {
      const strongPin = generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH);
      expect(pinService.isValid(strongPin)).toBe(true);
    });
  });
});
