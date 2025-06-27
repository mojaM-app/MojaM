import { Service } from 'typedi';
import { SystemPermissions } from '@core';
import { BaseRepository } from '@db';
import { getAdminLoginData } from '@utils';
import { UserPermissionsRepository } from './user-permissions.repository';
import { UserSystemPermission } from '../../../dataBase/entities/users/user-system-permission.entity';
import { IUserPermissionsDto } from '../dtos/get-permissions.dto';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _adminUserUuid: string;
  constructor(private readonly _userPermissionsRepository: UserPermissionsRepository) {
    super();
    this._adminUserUuid = getAdminLoginData().uuid;
  }

  public async get(): Promise<IUserPermissionsDto[]> {
    const users = await this._dbContext.users
      .createQueryBuilder('user')
      .leftJoinAndSelect(UserSystemPermission, 'permissions', 'permissions.UserId = user.Id')
      .leftJoinAndSelect('permissions.systemPermission', 'systemPermission')
      .where('user.uuid != :adminUuid', { adminUuid: this._adminUserUuid })
      .getMany();

    const result: IUserPermissionsDto[] = [];

    for (const user of users) {
      const userPermissions: SystemPermissions[] = user.systemPermissions
        ? user.systemPermissions.map(permission => permission.systemPermission.id as SystemPermissions)
        : [];

      const readonlyPermissions = await this._userPermissionsRepository.getByAttributes(user);

      result.push({
        id: user.uuid,
        name: user.getLastFirstNameOrEmail(),
        permissions: userPermissions.join(','),
        readonlyPermissions: readonlyPermissions.join(','),
      } satisfies IUserPermissionsDto);
    }

    return result;
  }
}
