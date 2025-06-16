import { IRoutes } from '@core';

export interface IModule {
  getRoutes(): IRoutes[];
  register(): void;
}
