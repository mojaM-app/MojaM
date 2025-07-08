import { type IModule, type IRoutes } from '@core';
import { SecurityRoute } from './routes/security.routes';

export class SecurityModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new SecurityRoute()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
