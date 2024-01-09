import { User } from '@db/DbModels';
import { SystemPermission } from '@modules/permissions';

export class Identity {
  public get userId(): number | undefined {
    return this._user?.id;
  }

  public get userUuid(): string | undefined {
    return this._user?.uuid;
  }

  private readonly _user: User | undefined;
  private readonly _permissions: SystemPermission[];

  public constructor(user: User | undefined, permissions: SystemPermission[]) {
    this._user = !!user
      ? <User>{
          id: user.id,
          uuid: user.uuid,
        }
      : undefined;
    this._permissions = permissions;
  }

  public isAuthenticated(): boolean {
    return this.userId > 0;
  }

  public hasPermissionToPreviewUserProfile(): boolean {
    return this.hasPermission(SystemPermission.PreviewUserProfile);
  }

  public hasPermissionToEditUserProfile(): boolean {
    return this.hasPermission(SystemPermission.EditUserProfile);
  }

  public hasPermissionToAddUser(): boolean {
    return this.hasPermission(SystemPermission.AddUser);
  }

  public hasPermissionToDeactivateUser(): boolean {
    return this.hasPermission(SystemPermission.DeactivateUser);
  }

  public hasPermissionToActivateUser(): boolean {
    return this.hasPermission(SystemPermission.ActivateUser);
  }

  public hasPermissionToDeleteUser(): boolean {
    return this.hasPermission(SystemPermission.DeleteUser);
  }

  public hasPermissionToAddPermission(): boolean {
    return this.hasPermission(SystemPermission.AddPermission);
  }

  public hasPermissionToDeletePermission(): boolean {
    return this.hasPermission(SystemPermission.DeletePermission);
  }

  protected hasPermission(permission: SystemPermission): boolean {
    return this.hasAnyPermission([permission]);
  }

  protected hasAnyPermission(permissions: SystemPermission[]): boolean {
    return this.isAuthenticated() && this._permissions?.length && permissions?.length && permissions.some(s => this._permissions.includes(s));
  }

  protected hasAllPermissions(permissions: SystemPermission[]): boolean {
    return this.isAuthenticated() && this._permissions?.length && permissions?.length && permissions.every(s => this._permissions.includes(s));
  }
}
