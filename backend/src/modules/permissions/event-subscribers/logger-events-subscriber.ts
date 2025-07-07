import { DatabaseLoggerService, events } from '@core';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';
import { PermissionAddedEvent } from '../events/permission-added-event';
import { PermissionDeletedEvent } from '../events/permission-deleted-event';
import { PermissionsRetrievedEvent } from '../events/permissions-retrieved-event';

@EventSubscriber()
export class PermissionsEventSubscriber {
  private readonly _databaseLoggerService: DatabaseLoggerService;

  constructor() {
    this._databaseLoggerService = Container.get(DatabaseLoggerService);
  }

  @On(events.permissions.permissionAdded)
  public onPermissionAdded(data: PermissionAddedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.currentUserId} added permission ${data.permissionId} for user ${data.userGuid}!`,
    );
  }

  @On(events.permissions.permissionDeleted)
  public onPermissionDeleted(data: PermissionDeletedEvent): void {
    this._databaseLoggerService.debug(
      `User ${data.currentUserId} deleted permission ${data.permissionId} for user ${data.userGuid}!`,
    );
  }

  @On(events.permissions.permissionsRetrieved)
  public onPermissionsRetrieved(data: PermissionsRetrievedEvent): void {
    this._databaseLoggerService.debug(`User ${data.currentUserId} retrieved all user permissions!`);
  }
}
