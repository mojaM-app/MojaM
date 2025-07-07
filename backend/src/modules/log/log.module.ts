import { IModule, IRoutes } from '@core';
import { LogRoute } from './routes/log.routes';

export class LogModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new LogRoute()];
  }

  public register(): void {}
}
