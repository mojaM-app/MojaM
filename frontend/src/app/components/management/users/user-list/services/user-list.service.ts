import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import {
  IUserGridItemDto,
  UsersGridData,
} from 'src/app/components/management/users/user-list/interfaces/user-list.interfaces';
import { DeleteResult } from 'src/core/delete-result.enum';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ErrorUtils } from 'src/utils/error.utils';
import { transformUser } from './transform-user';

@Injectable({
  providedIn: 'root',
})
export class UserListService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<UsersGridData | null> {
    return this._httpClient
      .request()
      .withParams({
        column: sortColumn,
        direction: sortDirection,
        pageIndex,
        pageSize,
      })
      .withUrl(this.API_ROUTES.userList.get())
      .get<UsersGridData>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: UsersGridData) => {
          if (resp.items?.length > 0) {
            resp.items.forEach((item: IUserGridItemDto) => {
              transformUser(item);
            });
          }
          return resp;
        })
      );
  }

  public delete(uuid: string): Observable<DeleteResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.delete(uuid))
      .delete<boolean>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map(() => DeleteResult.Success),
        catchError((error: unknown) => {
          if (ErrorUtils.isConflictError(error)) {
            return of(DeleteResult.DbFkConstraintError);
          }
          return throwError(() => error);
        })
      );
  }
}
