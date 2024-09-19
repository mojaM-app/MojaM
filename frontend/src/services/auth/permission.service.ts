import { Injectable } from '@angular/core';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  public constructor(private _authTokenService: AuthTokenService) {}

  public hasAnyPermission(permissions: SystemPermissionValue[]): boolean {
    if (!permissions?.length) {
      return false;
    }

    for (const perm of permissions) {
      if (this.hasPermission(perm)) {
        return true;
      }
    }

    return false;
  }

  public hasPermission(permission: SystemPermissionValue): boolean {
    const permissions = this._authTokenService.getUserPermissions();

    return permissions.includes(permission) === true;
  }
}
