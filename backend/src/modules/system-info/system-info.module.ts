import { type IModule, type IRoutes } from '@core';
import { SystemInfoRoute } from './routes/system-info.route';

export class SystemInfoModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new SystemInfoRoute()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
  }
}
