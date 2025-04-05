import { generateRandomNumber } from '@utils/tests.utils';
import { AuthenticationTypes } from '../enums/authentication-type.enum';
import { PasswordService } from '../services/password.service';
import { PinService } from '../services/pin.service';
import { getAuthenticationType } from './auth.helper';

describe('getAuthenticationType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return undefined when passcode is null or empty or undefined', () => {
    expect(getAuthenticationType({ passcode: null })).toBeUndefined();
    expect(getAuthenticationType({ passcode: '' })).toBeUndefined();
    expect(getAuthenticationType({ passcode: undefined })).toBeUndefined();
  });

  test('should return AuthenticationTypes.Pin when passcode length matches PinService.HASH_LENGTH', () => {
    const passcode = generateRandomNumber(PinService.HASH_LENGTH);
    expect(getAuthenticationType({ passcode })).toBe(AuthenticationTypes.Pin);
  });

  test('should return AuthenticationTypes.Password when passcode length matches PasswordService.HASH_LENGTH', () => {
    const passcode = generateRandomNumber(PasswordService.HASH_LENGTH);
    expect(getAuthenticationType({ passcode })).toBe(AuthenticationTypes.Password);
  });

  test('should return undefined when passcode length does not match any HASH_LENGTH', () => {
    const passcode = '1'; // Length does not match any HASH_LENGTH
    expect(getAuthenticationType({ passcode })).toBeUndefined();
  });
});
