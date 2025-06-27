import { type IRoutes } from './routes.interfaces';

export interface IModule {
  getRoutes: () => IRoutes[];
  register: () => void;
}
