import { type ICryptoService, type IModule, type IPasscodeService, type IRoutes } from '@core';
import { Container } from 'typedi';
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
  }
}
