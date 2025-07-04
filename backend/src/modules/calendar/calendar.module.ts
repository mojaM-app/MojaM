import { type IModule, type IRoutes } from '@core';
import { CalendarRoutes } from './routes/calendar.routes';
import './event-subscribers/logger-events-subscriber';

export class CalendarModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new CalendarRoutes()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
