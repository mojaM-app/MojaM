import { Event } from '@core';

export class PermissionAddedEvent extends Event {
  public readonly userGuid: string | undefined;
  public readonly permissionId: number | undefined;

  constructor(userGuid: string | undefined, permissionId: number | undefined, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.permissionId = permissionId;
  }
}
