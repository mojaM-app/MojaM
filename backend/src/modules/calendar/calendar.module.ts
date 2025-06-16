import { IModule, IRoutes } from '@core';
import { CalendarRoutes } from './routes/calendar.routes';

export class CalendarModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new CalendarRoutes()];
  }

  public register(): void {}
}
