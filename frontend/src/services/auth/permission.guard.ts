import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { SnackBarService } from '../snackbar/snack-bar.service';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard {
  private _componentToRedirect = '/no-permission';

  public constructor(
    private _permissionService: PermissionService,
    private _router: Router,
    private _authService: AuthService,
    private _snackBarService: SnackBarService
  ) {}

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!route || state.url === this._componentToRedirect || route.children.length) {
      return true;
    }

    // when no permissions explicitly set for this route, check for parents permissions
    const checkSession = route.data?.['checkSession'] || this.getParentCheckSession(route);
    if (checkSession === true && this._authService.isSessionValid() !== true) {
      this._snackBarService.translateAndShowError('Errors/Session_Expired');
      return false;
    }

    // when no permissions explicitly set for this route, check for parents permissions
    const permissions = route.data?.['permissions'] || this.getParentPermissions(route);
    if (!(permissions?.length > 0)) {
      return true;
    }

    const hasAccess = this._permissionService.hasAnyPermission(permissions);
    if (hasAccess) {
      return true;
    } else {
      return this._router.parseUrl(this._componentToRedirect);
    }
  }

  public canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    return this.canActivate(route, state);
  }

  private getParentCheckSession(route: ActivatedRouteSnapshot): boolean {
    if (!route?.parent) {
      return false;
    }

    if (route.parent.data?.['checkSession']) {
      return route.parent.data?.['checkSession'] || [];
    } else {
      return this.getParentCheckSession(route.parent);
    }
  }

  private getParentPermissions(route: ActivatedRouteSnapshot): SystemPermissionValue[] {
    if (!route?.parent) {
      return [];
    }

    if (route.parent.data?.['permissions']) {
      return route.parent.data?.['permissions'] || [];
    } else {
      return this.getParentPermissions(route.parent);
    }
  }
}
