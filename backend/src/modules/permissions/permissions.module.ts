import { IModule, IPermissionsService, IRoutes, IUserEntity } from '@core';
import Container from 'typedi';
import { UserPermissionsRepository } from './repositories/user-permissions.repository';
import { PermissionsRoute } from './routes/permissions.routes';

export class PermissionsModule implements IModule {
  public getRoutes(): IRoutes[] {
    return [new PermissionsRoute()];
  }

  public register(): void {
    Container.set<IPermissionsService>('IPermissionsService', {
      getUserPermissions(user: IUserEntity | null | undefined): Promise<number[]> {
        const repository = Container.get(UserPermissionsRepository);
        return repository.get(user);
      },
    } satisfies IPermissionsService);
  }
}
