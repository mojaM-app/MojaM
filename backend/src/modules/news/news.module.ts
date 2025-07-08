import { type IModule, type IRoutes } from '@core';
import { NewsRoutes } from './routes/news.routes';

export class NewsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new NewsRoutes()];
  }

  public register(): void {
    // This module does not require any specific registration logic.
    // If any services or repositories need to be registered, they can be added here.
  }
}
