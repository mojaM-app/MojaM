import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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
    private _spinnerService: SpinnerService
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
              if (
                !StringUtils.isString(user.permissions) ||
                StringUtils.isEmpty(user.permissions)
              ) {
                user.permissions = [];
                return;
              }

              const splittedPermissions = (user.permissions as unknown as string).split(',');
              if (splittedPermissions.length > 0) {
                user.permissions = splittedPermissions.map(
                  permission => NumbersUtils.parse(permission) ?? 0
                );
              } else {
                user.permissions = [];
              }
            });
          }
          return resp;
        })
      );
  }
}
