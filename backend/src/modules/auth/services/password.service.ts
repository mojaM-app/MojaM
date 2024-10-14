import { isNullOrEmptyString, VALIDATOR_SETTINGS } from '@utils';
import { isStrongPassword, maxLength } from 'class-validator';
import * as crypto from 'crypto';
import Container, { Service } from 'typedi';
import { CryptoService } from './crypto.service';

@Service()
export class PasswordService {
  private readonly _cryptoService: CryptoService;

  public constructor() {
    this._cryptoService = Container.get(CryptoService);
  }

  public hashPassword(salt: string, password: string): string {
    if (isNullOrEmptyString(salt) || isNullOrEmptyString(password)) {
      throw new Error('Salt and password are required to hash a password');
    }

    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public passwordMatches(password: string, salt: string, hashedPassword: string): boolean {
    return this.hashPassword(salt, password) === hashedPassword;
  }

  public isPasswordValid(password: string): boolean {
    if (isNullOrEmptyString(password)) {
      return false;
    }

    return maxLength(password, VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH) && isStrongPassword(password, VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS);
  }
}
