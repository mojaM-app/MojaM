import { IModule, IRoutes } from '@core';
import { AnnouncementsListRoute } from './routes/announcements-list.routes';
import { AnnouncementsRout } from './routes/announcements.routes';

export class AnnouncementsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new AnnouncementsListRoute(), new AnnouncementsRout()];
  }

  public register(): void {}
}
