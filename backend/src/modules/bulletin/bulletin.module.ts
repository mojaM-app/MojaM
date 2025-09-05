import { type IModule, type IRoutes } from '@core';
import { BulletinCalendarViewRoutes } from './routes/bulletin-calendar-view.routes';
import { BulletinListRoutes } from './routes/bulletin-list.routes';
import { BulletinRoutes } from './routes/bulletin.routes';

export class BulletinModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new BulletinRoutes(), new BulletinListRoutes(), new BulletinCalendarViewRoutes()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
