import { SystemPermissions } from '@modules/permissions';
import { User } from '@modules/users/entities/user.entity';

export class Identity {
  public get userId(): number | undefined {
    return this._user?.id;
  }

  public get userUuid(): string | undefined {
    return this._user?.uuid;
  }

  private readonly _user: { id: number | undefined; uuid: string | undefined };
  private readonly _permissions: SystemPermissions[];

  public constructor(user: User | undefined | null, permissions: SystemPermissions[]) {
    this._user = {
      id: user?.id,
      uuid: user?.uuid,
    };
    this._permissions = permissions;
  }

  public isAuthenticated(): boolean {
    return (this.userId ?? 0) > 0;
  }

  public hasPermissionToGetAnnouncements(): boolean {
    return this.hasAnyPermission([SystemPermissions.PreviewAnnouncementsList, SystemPermissions.EditAnnouncements]);
  }

  public hasPermissionToPublishAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.PublishAnnouncements);
  }

  public hasPermissionToPreviewAnnouncementsList(): boolean {
    return this.hasPermission(SystemPermissions.PreviewAnnouncementsList);
  }

  public hasPermissionToDeleteAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.DeleteAnnouncements);
  }

  public hasPermissionToEditAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.EditAnnouncements);
  }

  public hasPermissionToAddAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.AddAnnouncements);
  }

  public hasPermissionToPreviewUserList(): boolean {
    return this.hasPermission(SystemPermissions.PreviewUserList);
  }

  public hasPermissionToPreviewUserDetails(): boolean {
    return this.hasPermission(SystemPermissions.PreviewUserDetails);
  }

  public hasPermissionToEditUser(): boolean {
    return this.hasPermission(SystemPermissions.EditUser);
  }

  public hasPermissionToAddUser(): boolean {
    return this.hasPermission(SystemPermissions.AddUser);
  }

  public hasPermissionToDeactivateUser(): boolean {
    return this.hasPermission(SystemPermissions.DeactivateUser);
  }

  public hasPermissionToActivateUser(): boolean {
    return this.hasPermission(SystemPermissions.ActivateUser);
  }

  public hasPermissionToDeleteUser(): boolean {
    return this.hasPermission(SystemPermissions.DeleteUser);
  }

  public hasPermissionToUnlockUser(): boolean {
    return this.hasPermission(SystemPermissions.UnlockUser);
  }

  public hasPermissionToAddPermission(): boolean {
    return this.hasPermission(SystemPermissions.AddPermission);
  }

  public hasPermissionToDeletePermission(): boolean {
    return this.hasPermission(SystemPermissions.DeletePermission);
  }

  protected hasPermission(permission: SystemPermissions): boolean {
    return this.hasAnyPermission([permission]);
  }

  protected hasAnyPermission(permissions: SystemPermissions[]): boolean {
    return this.isAuthenticated() && this._permissions?.length > 0 && permissions?.length > 0 && permissions.some(s => this._permissions.includes(s));
  }

  protected hasAllPermissions(permissions: SystemPermissions[]): boolean {
    return (
      this.isAuthenticated() && this._permissions?.length > 0 && permissions?.length > 0 && permissions.every(s => this._permissions.includes(s))
    );
  }
}
