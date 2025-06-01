import { logger } from '@core';
import { events } from '@events';
import { PermissionsRetrievedEvent } from '@modules/permissions';
import { EventSubscriber, On } from 'event-dispatch';
import { PermissionAddedEvent } from '../../modules/permissions/events/permission-added-event';
import { PermissionDeletedEvent } from '../../modules/permissions/events/permission-deleted-event';

@EventSubscriber()
export class PermissionsEventSubscriber {
  @On(events.permissions.permissionAdded)
  public onPermissionAdded(data: PermissionAddedEvent): void {
    logger.debug(`User ${data?.currentUserId} added permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }

  @On(events.permissions.permissionDeleted)
  public onPermissionDeleted(data: PermissionDeletedEvent): void {
    logger.debug(`User ${data?.currentUserId} deleted permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }

  @On(events.permissions.permissionsRetrieved)
  public onPermissionsRetrieved(data: PermissionsRetrievedEvent): void {
    logger.debug(`User ${data?.currentUserId} retrieved all user permissions!`);
  }
}
