import { type IModule, type IRoutes } from '@core';
import { CommunityRoutes } from './routes/community.routes';

export class CommunityModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new CommunityRoutes()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
