import { ICryptoService } from '@core/interfaces';
import { randomBytes } from 'crypto';
import { Service } from 'typedi';

@Service()
export class CryptoService implements ICryptoService {
  public generateSalt(): string {
    const numberOfBytes = 16;
    return randomBytes(numberOfBytes).toString('hex');
  }

  public generateUserRefreshTokenKey(): string {
    const numberOfBytes = 32;
    return randomBytes(numberOfBytes).toString('hex');
  }

  public generateResetPasscodeToken(): string {
    const numberOfBytes = 32;
    return randomBytes(numberOfBytes).toString('hex');
  }
}
