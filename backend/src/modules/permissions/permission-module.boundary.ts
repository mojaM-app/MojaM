import { IPermissionModuleBoundary } from '@core';
import { Service } from 'typedi';
import { UserPermissionsRepository } from './repositories/user-permissions.repository';
import { User } from '../../dataBase/entities/users/user.entity';

@Service()
export class PermissionModuleBoundary implements IPermissionModuleBoundary {
  constructor(private readonly _userPermissionsRepository: UserPermissionsRepository) {}

  public async getUserPermissions(user: User | null | undefined): Promise<number[]> {
    return this._userPermissionsRepository.get(user);
  }
}
