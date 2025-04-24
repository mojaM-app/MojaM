import { BaseRepository } from '@modules/common';
import { IUserPermissionsDto, SystemPermissions, UserPermissionsRepository } from '@modules/permissions';
import { UserSystemPermission } from '@modules/users/entities/user-system-permission.entity';
import { getAdminLoginData } from '@utils/tests.utils';
import Container, { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _userPermissionsRepository: UserPermissionsRepository;
  private readonly _adminUserUuid: string;
  constructor() {
    super();
    this._userPermissionsRepository = Container.get(UserPermissionsRepository);
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
        ? user.systemPermissions.map(p => p.systemPermission?.id as SystemPermissions)
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
