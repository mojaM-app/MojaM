import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IUserDetails } from '../interfaces/user-details.interfaces';
import { transformUser } from './transform-user';

@Injectable({
  providedIn: 'root',
})
export class UserDetailsService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(uuid: string): Observable<IUserDetails | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.userDetails.get(uuid))
      .get<IUserDetails>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IUserDetails) => {
          if (resp) {
            resp = transformUser(resp);
          }
          return resp;
        })
      );
  }
}
