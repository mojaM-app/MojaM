import { events } from '@events';
import { BaseService } from '@modules/common';
import {
  AddPermissionReqDto,
  DeletePermissionsReqDto,
  GetPermissionsReqDto,
  IUserPermissionsDto,
  PermissionAddedEvent,
  PermissionDeletedEvent,
  PermissionsRepository,
  PermissionsRetrievedEvent,
  SystemPermissions,
  UserPermissionsRepository,
} from '@modules/permissions';
import { isEnumValue, isGuid, isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';

@Service()
export class PermissionsService extends BaseService {
  private readonly _userPermissionsRepository: UserPermissionsRepository;
  private readonly _permissionsRepository: PermissionsRepository;

  constructor() {
    super();
    this._userPermissionsRepository = Container.get(UserPermissionsRepository);
    this._permissionsRepository = Container.get(PermissionsRepository);
  }

  public async get(reqDto: GetPermissionsReqDto): Promise<IUserPermissionsDto[]> {
    const result = await this._permissionsRepository.get();

    this._eventDispatcher.dispatch(events.permissions.permissionsRetrieved, new PermissionsRetrievedEvent(reqDto.currentUserId));

    return result;
  }

  public async add(reqDto: AddPermissionReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || !isEnumValue(SystemPermissions, reqDto.permissionId)) {
      return false;
    }

    const result = await this._userPermissionsRepository.add(reqDto);

    if (result) {
      this._eventDispatcher.dispatch(
        events.permissions.permissionAdded,
        new PermissionAddedEvent(reqDto.userGuid, reqDto.permissionId, reqDto.currentUserId),
      );
    }

    return result;
  }

  public async delete(reqDto: DeletePermissionsReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid) || (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermissions, reqDto.permissionId))) {
      return false;
    }

    const result = await this._userPermissionsRepository.delete(reqDto);

    if (result) {
      this._eventDispatcher.dispatch(
        events.permissions.permissionDeleted,
        new PermissionDeletedEvent(reqDto.userGuid, reqDto.permissionId, reqDto.currentUserId),
      );
    }

    return result;
  }
}
