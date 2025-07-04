import { type IModule, type IRoutes } from '@core';
import { AnnouncementsListRoute } from './routes/announcements-list.routes';
import { AnnouncementsRout } from './routes/announcements.routes';
import './event-subscribers/logger-events-subscriber';

export class AnnouncementsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new AnnouncementsListRoute(), new AnnouncementsRout()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
