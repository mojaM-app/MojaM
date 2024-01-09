import { BaseService } from '@modules/common';
import {
  AddPermissionPayload,
  AddPermissionReqDto,
  DeletePermissionsPayload,
  DeletePermissionsReqDto,
  PermissionRepository,
} from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { Container, Service } from 'typedi';

@Service()
export class PermissionsService extends BaseService {
  private readonly _userRepository: UsersRepository | undefined = undefined;
  private readonly _permissionRepository: PermissionRepository | undefined = undefined;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
    this._permissionRepository = Container.get(PermissionRepository);
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    const userId: number = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!userId) {
      return false;
    }

    return await this._permissionRepository.add(new AddPermissionPayload(userId, reqDto));
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    const userId: number = await this._userRepository.getIdByUuid(reqDto.userGuid);

    if (!userId) {
      return false;
    }

    return await this._permissionRepository.delete(new DeletePermissionsPayload(userId, reqDto));
  }
}
