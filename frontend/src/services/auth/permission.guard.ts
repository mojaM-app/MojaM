import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard {
  private _componentToRedirect = '/no-permission';

  public constructor(
    private _permissionService: PermissionService,
    private _router: Router
  ) {}

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!route || state.url === this._componentToRedirect || route.children.length) {
      return true;
    }

    // when no permissions explicitly set for this route, check for parents permissions
    const permissions = route.data?.['permissions'] || this.getParentPermissions(route);
    if (!permissions?.length) {
      return true;
    }

    const hasAccess = this._permissionService.hasAnyPermission(permissions);
    if (hasAccess) {
      return true;
    } else {
      return this._router.parseUrl(this._componentToRedirect);
    }
  }

  public canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.canActivate(route, state);
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
