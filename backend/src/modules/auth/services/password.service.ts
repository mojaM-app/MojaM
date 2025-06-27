import { isStrongPassword, maxLength } from 'class-validator';
import * as crypto from 'crypto';
import { Service } from 'typedi';
import { IAuthenticationTypeService } from '../interfaces/IAuthenticationTypeService';
import { VALIDATOR_SETTINGS } from './../../../config/index';
import { isNullOrEmptyString } from './../../../utils/index';

@Service()
export class PasswordService implements IAuthenticationTypeService {
  public static readonly HASH_LENGTH = 128;
  private static readonly KEY_LENGTH = 64;

  public getHash(salt: string, password: string): string {
    if (isNullOrEmptyString(salt) || isNullOrEmptyString(password)) {
      throw new Error('Salt and password are required to hash a password');
    }

    return crypto.pbkdf2Sync(password, salt, 1000, PasswordService.KEY_LENGTH, 'sha512').toString('hex');
  }

  public match(password: string, salt: string, hashedPassword: string): boolean {
    return this.getHash(salt, password) === hashedPassword;
  }

  public isValid(password: string | undefined | null): boolean {
    if (isNullOrEmptyString(password)) {
      return false;
    }

    return maxLength(password, VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH) && isStrongPassword(password, VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS);
  }
}
