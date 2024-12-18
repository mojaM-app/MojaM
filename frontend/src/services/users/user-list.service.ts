import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';
import { UsersGridData } from 'src/interfaces/users/user-list.interfaces';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { SpinnerService } from '../spinner/spinner.service';

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
      .pipe(this._spinnerService.waitForSubscription());
  }
}
