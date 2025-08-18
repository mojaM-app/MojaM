import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { DeleteResult } from 'src/core/delete-result.enum';
import { IUser } from 'src/core/interfaces/users/user.interfaces';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ErrorUtils } from 'src/utils/error.utils';
import { AddUserDto } from '../user-form/models/add-user.model';
import { EditUserDto } from '../user-form/models/edit-user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(uuid: string): Observable<IUser> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.get(uuid))
      .get<IUser>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IUser) => {
          if (resp) {
            resp.joiningDate = this.toDateTime(resp.joiningDate);
          }

          return resp;
        })
      );
  }

  public create(model: AddUserDto): Observable<IUser> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.create())
      .withBody({ ...model })
      .post<IUser>()
      .pipe(this._spinnerService.waitForSubscription());
  }

  public update(model: EditUserDto): Observable<IUser> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.update(model.id))
      .withBody({ ...model })
      .put<IUser>()
      .pipe(this._spinnerService.waitForSubscription());
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

  public unlock(uuid: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.unlock(uuid))
      .post<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }

  public activate(uuid: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.activate(uuid))
      .post<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }

  public deactivate(uuid: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.user.deactivate(uuid))
      .post<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
