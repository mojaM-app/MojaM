import { events } from '@events';
import { EventSubscriber, On } from 'event-dispatch';
import { PermissionAddedEventDto } from '../dtos/add-permission.dto';
import { PermissionDeletedEventDto } from '../dtos/delete-permissions.dto';

@EventSubscriber()
export class PermissionEventSubscriber {
  @On(events.permissions.permissionAdded)
  public onPermissionAdded(data: PermissionAddedEventDto): void {
    console.log(`User ${data?.currentUserId} added permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }

  @On(events.permissions.permissionDeleted)
  public onPermissionDeleted(data: PermissionDeletedEventDto): void {
    console.log(`User ${data?.currentUserId} deleted permission ${data?.permissionId} for user ${data?.userGuid}!`);
  }
}
