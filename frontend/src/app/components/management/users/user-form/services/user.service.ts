import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IUser } from 'src/interfaces/users/user.interfaces';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { AddUserDto } from '../models/add-user.model';
import { EditUserDto } from '../models/edit-user.model';

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
            resp.joiningDate = resp.joiningDate ? new Date(resp.joiningDate) : null;
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
}
