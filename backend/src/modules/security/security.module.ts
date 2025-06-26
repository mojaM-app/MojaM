import { IModule, IRoutes } from '@core';
import { SecurityRoute } from './routes/security.routes';

export class SecurityModule implements IModule {
  private _routes: IRoutes[] = [];

  public register(): void {
    this._routes = [new SecurityRoute()];
  }

  public getRoutes(): IRoutes[] {
    return this._routes;
  }
}
