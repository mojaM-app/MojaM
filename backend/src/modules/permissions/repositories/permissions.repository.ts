import { BaseRepository } from '@modules/common';
import { IUserPermissionsDto, SystemPermission } from '@modules/permissions';
import { User } from '@modules/users/entities/user.entity';
import { isArrayEmpty } from '@utils';
import { getAdminLoginData } from '@utils/tests.utils';
import { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _adminUserUuid: string;
  public constructor() {
    super();
    this._adminUserUuid = getAdminLoginData().uuid;
  }

  public async get(): Promise<IUserPermissionsDto[]> {
    const user = await this._dbContext.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.systemPermissions', 'systemPermission')
      .where('user.IsDeleted = :isDeleted', { isDeleted: false })
      .andWhere('user.Uuid != :uuid', { uuid: this._adminUserUuid })
      .getMany();

    if (isArrayEmpty(user)) {
      return [];
    }

    return user.map(u => {
      return {
        id: u.uuid,
        name: u.getFullNameOrEmail(),
        permissions: (u.systemPermissions ?? []).map(sp => sp.systemPermission).join(','),
        readonlyPermissions: this.getReadonlyPermissions(u),
      } satisfies IUserPermissionsDto;
    });
  }

  private getReadonlyPermissions(user: User): string | undefined {
    if (user.uuid === this._adminUserUuid) {
      return (Object.values(SystemPermission).filter(value => typeof value === 'number') as number[]).join(',');
    }

    return undefined;
  }
}
