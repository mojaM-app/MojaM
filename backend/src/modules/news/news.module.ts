import { IModule, IRoutes } from '@core';
import { NewsRoutes } from './routes/news.routes';

export class NewsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new NewsRoutes()];
  }

  public register(): void {}
}
