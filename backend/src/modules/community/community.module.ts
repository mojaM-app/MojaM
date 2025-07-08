import { type IModule, type IRoutes } from '@core';
import { CommunityRoute } from './routes/community.routes';

export class CommunityModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new CommunityRoute()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
