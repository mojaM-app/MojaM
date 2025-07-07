import { SystemPermissions } from '../enums/system-permissions.enum';

export class Identity {
  public get userId(): number | undefined {
    return this._user.id;
  }

  public get userUuid(): string | undefined {
    return this._user.uuid;
  }

  private readonly _user: { id: number | undefined; uuid: string | undefined };
  private readonly _permissions: SystemPermissions[] = [];

  constructor(user: { id?: number; uuid?: string } | undefined | null, permissions: SystemPermissions[]) {
    this._user = {
      id: user?.id,
      uuid: user?.uuid,
    };
    this._permissions.push(...permissions);
  }

  public isAuthenticated(): boolean {
    return (this.userId ?? 0) > 0;
  }

  public canGetAnnouncements(): boolean {
    return this.hasAnyPermission([SystemPermissions.PreviewAnnouncementsList, SystemPermissions.EditAnnouncements]);
  }

  public canPublishAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.PublishAnnouncements);
  }

  public canPreviewAnnouncementsList(): boolean {
    return this.hasPermission(SystemPermissions.PreviewAnnouncementsList);
  }

  public canDeleteAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.DeleteAnnouncements);
  }

  public canEditAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.EditAnnouncements);
  }

  public canAddAnnouncements(): boolean {
    return this.hasPermission(SystemPermissions.AddAnnouncements);
  }

  public canPreviewUserList(): boolean {
    return this.hasPermission(SystemPermissions.PreviewUserList);
  }

  public canPreviewUserDetails(): boolean {
    return this.hasPermission(SystemPermissions.PreviewUserDetails);
  }

  public canEditUser(): boolean {
    return this.hasPermission(SystemPermissions.EditUser);
  }

  public canAddUser(): boolean {
    return this.hasPermission(SystemPermissions.AddUser);
  }

  public canDeactivateUser(): boolean {
    return this.hasPermission(SystemPermissions.DeactivateUser);
  }

  public canActivateUser(): boolean {
    return this.hasPermission(SystemPermissions.ActivateUser);
  }

  public canDeleteUser(): boolean {
    return this.hasPermission(SystemPermissions.DeleteUser);
  }

  public canUnlockUser(): boolean {
    return this.hasPermission(SystemPermissions.UnlockUser);
  }

  public canAddPermission(): boolean {
    return this.hasPermission(SystemPermissions.AddPermission);
  }

  public canDeletePermission(): boolean {
    return this.hasPermission(SystemPermissions.DeletePermission);
  }

  public canPreviewLogList(): boolean {
    return this.hasPermission(SystemPermissions.PreviewLogList);
  }

  protected hasPermission(permission: SystemPermissions): boolean {
    return this.hasAnyPermission([permission]);
  }

  protected hasAnyPermission(permissions: SystemPermissions[]): boolean {
    return (
      this.isAuthenticated() &&
      this._permissions.length > 0 &&
      permissions.length > 0 &&
      permissions.some(permission => this._permissions.includes(permission))
    );
  }
}
