import { type IRoutes } from '@core';

export interface IModule {
  getRoutes: () => IRoutes[];
  register: () => void;
}
