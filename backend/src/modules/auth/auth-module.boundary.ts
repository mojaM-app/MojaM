import { IAuthModuleBoundary, ICryptoService, IPasswordService, IResetPasscodeService } from '@core';
import Container, { Service } from 'typedi';
import { ResetPasscodeTokensRepository } from './repositories/reset-passcode-tokens.repository';
import { CryptoService } from './services/crypto.service';
import { PasswordService } from './services/password.service';

@Service()
export class AuthModuleBoundary implements IAuthModuleBoundary {
  constructor() {
    Container.set<ICryptoService>('ICryptoService', Container.get(CryptoService));
    Container.set<IPasswordService>('IPasswordService', Container.get(PasswordService));
    Container.set<IResetPasscodeService>('IResetPasscodeService', {
      deleteResetPasscodeTokens(userId: number): Promise<boolean> {
        const resetPasscodeTokensRepository = Container.get(ResetPasscodeTokensRepository);
        return resetPasscodeTokensRepository.deleteTokens(userId);
      },
    } satisfies IResetPasscodeService);
  }
}
