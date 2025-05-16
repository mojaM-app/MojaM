import { REGEX_PATTERNS, VALIDATOR_SETTINGS } from '@config';
import { isNullOrEmptyString } from '@utils';
import { matches, maxLength, minLength } from 'class-validator';
import * as crypto from 'crypto';
import { Service } from 'typedi';
import { IAuthenticationTypeService } from '../interfaces/IAuthenticationTypeService';

@Service()
export class PinService implements IAuthenticationTypeService {
  public static readonly HASH_LENGTH = 64;
  private static readonly KEY_LENGTH = 32;

  public getHash(salt: string, pin: string): string {
    if (isNullOrEmptyString(salt) || isNullOrEmptyString(pin)) {
      throw new Error('Salt and pin are required to hash a pin');
    }

    return crypto.pbkdf2Sync(pin, salt, 1000, PinService.KEY_LENGTH, 'sha512').toString('hex');
  }

  public match(pin: string, salt: string, hashedPin: string): boolean {
    return this.getHash(salt, pin) === hashedPin;
  }

  public isValid(pin: string | undefined | null): boolean {
    if (isNullOrEmptyString(pin)) {
      return false;
    }

    return minLength(pin, VALIDATOR_SETTINGS.PIN_LENGTH) && maxLength(pin, VALIDATOR_SETTINGS.PIN_LENGTH) && matches(pin!, REGEX_PATTERNS.PIN);
  }
}
