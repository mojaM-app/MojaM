import { VALIDATOR_SETTINGS } from '@config';
import { generateRandomNumber, generateRandomPassword } from '@utils';
import 'reflect-metadata';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import * as authHelper from '../helpers/auth.helper';
import { PasscodeService } from './passcode.service';

jest.mock('../helpers/auth.helper');

describe('PasscodeService', () => {
  let passcodeService: PasscodeService;

  beforeEach(() => {
    passcodeService = new PasscodeService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isValid', () => {
    it('should return false if passcode is null or empty', () => {
      expect(passcodeService.isValid(null)).toBe(false);
      expect(passcodeService.isValid('')).toBe(false);
    });

    it('should return true if passcode is valid as password or pin', () => {
      expect(passcodeService.isValid(generateRandomPassword())).toBe(true);
      expect(passcodeService.isValid(generateRandomNumber(VALIDATOR_SETTINGS.PIN_LENGTH))).toBe(true);
    });

    it('should return false if passcode is neither valid as password nor pin', () => {
      expect(passcodeService.isValid('invalid')).toBe(false);
    });
  });

  describe('match', () => {
    it('should return false if passcode or user.passcode is null or empty', () => {
      expect(passcodeService.match({ salt: 'salt', passcode: null }, 'passcode')).toBe(false);
      expect(passcodeService.match({ salt: 'salt', passcode: 'userPasscode' }, null)).toBe(false);
    });

    it('should return false for unsupported authentication type', () => {
      jest.spyOn(authHelper, 'getAuthenticationType').mockReturnValue(-1 as AuthenticationTypes);

      expect(passcodeService.match({ salt: 'salt', passcode: 'userPasscode' }, 'passcode')).toBe(false);
    });
  });

  describe('getHash', () => {
    it('should return null if passcode is null or empty', () => {
      expect(passcodeService.getHash('salt', null)).toBeNull();
      expect(passcodeService.getHash('salt', '')).toBeNull();
    });

    it('should return null if passcode is neither password nor pin', () => {
      expect(passcodeService.getHash('salt', 'invalid')).toBeNull();
    });
  });
});
