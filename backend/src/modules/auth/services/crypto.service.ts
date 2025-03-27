import * as crypto from 'crypto';
import { Service } from 'typedi';

@Service()
export class CryptoService {
  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public generateUserRefreshTokenKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public generateResetPasscodeToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
