import { BaseRepository } from '@modules/common';
import { IUserPermissionsDto } from '@modules/permissions';
import { isArrayEmpty } from '@utils';
import { Service } from 'typedi';

@Service()
export class PermissionsRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async get(): Promise<IUserPermissionsDto[]> {
    const user = await this._dbContext.users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.systemPermissions', 'systemPermission')
      .where('user.IsDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    if (isArrayEmpty(user)) {
      return [];
    }

    return user.map(u => {
      return {
        id: u.uuid,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        permissions: (u.systemPermissions ?? []).map(sp => sp.systemPermission).join(','),
      } satisfies IUserPermissionsDto;
    });
  }
}
