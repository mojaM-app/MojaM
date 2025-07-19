import { type IModule, type IRoutes } from '@core';
import { BulletinRoute } from './routes/bulletin.route';

export class BulletinModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new BulletinRoute()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
