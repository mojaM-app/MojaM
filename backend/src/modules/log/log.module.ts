import { type IModule, type IRoutes } from '@core';
import { LogListRoutes } from './routes/log-list.routes';

export class LogModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new LogListRoutes()];
  }

  public register(): void {}
}
