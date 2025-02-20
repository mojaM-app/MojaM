import { BaseRepository } from '@modules/common';
import { IUserPermissionsDto, UserPermissionsRepository } from '@modules/permissions';
import { getAdminLoginData } from '@utils/tests.utils';
import Container, { Service } from 'typedi';
import { Not } from 'typeorm';

@Service()
export class PermissionsRepository extends BaseRepository {
  private readonly _userPermissionsRepository: UserPermissionsRepository;
  private readonly _adminUserUuid: string;
  public constructor() {
    super();
    this._userPermissionsRepository = Container.get(UserPermissionsRepository);
    this._adminUserUuid = getAdminLoginData().uuid;
  }

  public async get(): Promise<IUserPermissionsDto[]> {
    const users = await this._dbContext.users.find({
      where: {
        uuid: Not(this._adminUserUuid),
      },
    });

    const result = await Promise.all(
      users.map(async user => {
        const userPermissions = await this._userPermissionsRepository.get(user);
        const readonlyPermissions = await this._userPermissionsRepository.getByAttributes(user);
        return {
          id: user.uuid,
          name: user.getFullNameOrEmail(),
          permissions: userPermissions.join(','),
          readonlyPermissions: readonlyPermissions.join(','),
        } satisfies IUserPermissionsDto;
      }),
    );

    return result;
  }
}
