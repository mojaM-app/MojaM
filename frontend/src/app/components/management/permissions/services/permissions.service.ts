import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { PermissionService } from 'src/services/auth/permission.service';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { NumbersUtils } from 'src/utils/numbers.utils';
import { StringUtils } from 'src/utils/string.utils';
import { IUserPermissions } from '../interfaces/user-permissions.interface';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService,
    private _permissionService: PermissionService
  ) {
    super();
  }

  public get(): Observable<IUserPermissions[]> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.permissions.get())
      .get<IUserPermissions[]>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IUserPermissions[]) => {
          if (resp?.length > 0) {
            resp.forEach(user => {
              user.permissions = this.parsePermissions(user.permissions);
              user.readonlyPermissions = this.parsePermissions(user.readonlyPermissions);
            });
          }
          return resp;
        })
      );
  }

  private parsePermissions(value: unknown): number[] {
    if (!StringUtils.isString(value) || StringUtils.isEmpty(value)) {
      return [];
    }

    const splittedPermissions = (value as string).split(',');
    if (splittedPermissions.length > 0) {
      return splittedPermissions.map(permission => NumbersUtils.parse(permission) ?? 0);
    } else {
      return [];
    }
  }

  public save(
    userId: string,
    permission: SystemPermissionValue,
    checked: boolean
  ): Observable<boolean> {
    if (checked) {
      if (this._permissionService.hasPermission(SystemPermissionValue.AddPermission)) {
        return this._httpClient
          .request()
          .withUrl(this.API_ROUTES.permissions.save(userId, permission))
          .post<boolean>()
          .pipe(this._spinnerService.waitForSubscription());
      } else {
        throw Error('Errors/User_Not_Authorized');
      }
    } else {
      if (this._permissionService.hasPermission(SystemPermissionValue.DeletePermission)) {
        return this._httpClient
          .request()
          .withUrl(this.API_ROUTES.permissions.save(userId, permission))
          .delete<boolean>()
          .pipe(this._spinnerService.waitForSubscription());
      } else {
        throw Error('Errors/User_Not_Authorized');
      }
    }
  }
}
