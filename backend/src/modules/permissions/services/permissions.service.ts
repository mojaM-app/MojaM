import { BaseService } from '@modules/common/base.service';
import { PermissionRepository } from '@modules/permissions/repositories/permission.repository';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { Guid } from 'guid-typescript';
import { Container, Service } from 'typedi';

@Service()
export class PermissionService extends BaseService {
  private readonly _userRepository: UserRepository | undefined = undefined;
  private readonly _permissionRepository: PermissionRepository | undefined = undefined;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._permissionRepository = Container.get(PermissionRepository);
  }

  public async add(userGuid: Guid, permissionId: number, currentUserId: number): Promise<boolean> {
    const userId: number = await this._userRepository.getIdByUuid(userGuid);

    if (!userId) {
      return false;
    }

    return await this._permissionRepository.add(userId, permissionId, currentUserId);
  }

  public async delete(userGuid: Guid, permissionId?: number): Promise<boolean> {
    const userId: number = await this._userRepository.getIdByUuid(userGuid);

    if (!userId) {
      return false;
    }

    return await this._permissionRepository.delete(userId, permissionId);
  }
}
