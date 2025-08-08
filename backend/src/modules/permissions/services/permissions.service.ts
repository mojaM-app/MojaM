import { Service } from 'typedi';
import { BaseService, events, SystemPermissions } from '@core';
import { isEnumValue, isGuid, isNullOrUndefined } from '@utils';
import { AddPermissionReqDto } from '../dtos/add-permission.dto';
import { DeletePermissionsReqDto } from '../dtos/delete-permissions.dto';
import { GetPermissionsReqDto, IUserPermissionsDto } from '../dtos/get-permissions.dto';
import { PermissionAddedEvent } from '../events/permission-added-event';
import { PermissionDeletedEvent } from '../events/permission-deleted-event';
import { PermissionsRetrievedEvent } from '../events/permissions-retrieved-event';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { UserPermissionsRepository } from '../repositories/user-permissions.repository';

@Service()
export class PermissionsService extends BaseService {
  constructor(
    private readonly _userPermissionsRepository: UserPermissionsRepository,
    private readonly _permissionsRepository: PermissionsRepository,
  ) {
    super();
  }

  public async get(reqDto: GetPermissionsReqDto): Promise<IUserPermissionsDto[]> {
    const result = await this._permissionsRepository.get();

    this._eventDispatcher.dispatch(
      events.permissions.permissionsRetrieved,
      new PermissionsRetrievedEvent(reqDto.currentUserId),
    );

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
    if (
      !isGuid(reqDto.userGuid) ||
      (!isNullOrUndefined(reqDto.permissionId) && !isEnumValue(SystemPermissions, reqDto.permissionId))
    ) {
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
