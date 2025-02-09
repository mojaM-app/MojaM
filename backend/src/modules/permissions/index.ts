export { PermissionsController } from './controllers/permissions.controller';

export { AddPermissionReqDto, AddPermissionsResponseDto } from './dtos/add-permission.dto';
export { DeletePermissionsReqDto, DeletePermissionsResponseDto } from './dtos/delete-permissions.dto';
export { GetPermissionsReqDto, GetPermissionsResponseDto, type IUserPermissionsDto } from './dtos/get-permissions.dto';

export { PermissionAddedEvent } from './events/permission-added-event';
export { PermissionDeletedEvent } from './events/permission-deleted-event';
export { PermissionsRetrievedEvent } from './events/permissions-retrieved-event';

export { SystemPermission } from './enums/system-permission.enum';

export { PermissionsRepository } from './repositories/permissions.repository';
export { UserPermissionsRepository } from './repositories/user-permissions.repository';

export { PermissionsRoute } from './routes/permissions.routes';

export { PermissionsService } from './services/permissions.service';

export type { IPermissionId } from './interfaces/IPermissionId';
