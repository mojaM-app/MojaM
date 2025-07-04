import { type IModule, type IRoutes } from '@core';
import { CommunityRoute } from './routes/community.routes';

export class CommunityModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new CommunityRoute()];
  }

  public register(): void {}
}
