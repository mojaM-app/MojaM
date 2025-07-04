import { Container } from 'typedi';
import {
  type ICryptoService,
  type IModule,
  type IPasscodeService,
  type IResetPasscodeService,
  type IRoutes,
} from '@core';
import { ResetPasscodeTokensRepository } from './repositories/reset-passcode-tokens.repository';
import { AuthRoute } from './routes/auth.routes';
import { CryptoService } from './services/crypto.service';
import { PasscodeService } from './services/passcode.service';
import './event-subscribers/logger-events-subscriber';

export class AuthModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new AuthRoute()];
  }

  public register(): void {
    Container.set<ICryptoService>('ICryptoService', Container.get(CryptoService));
    Container.set<IPasscodeService>('IPasscodeService', Container.get(PasscodeService));
    Container.set<IResetPasscodeService>('IResetPasscodeService', {
      deleteResetPasscodeTokens(userId: number): Promise<boolean> {
        const resetPasscodeTokensRepository = Container.get(ResetPasscodeTokensRepository);
        return resetPasscodeTokensRepository.deleteTokens(userId);
      },
    } satisfies IResetPasscodeService);
  }
}
