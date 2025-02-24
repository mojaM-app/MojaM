import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IUserProfile } from '../user-profile/interfaces/user-profile.interfaces';
import { UpdateUserProfileDto } from '../user-profile/models/update-user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(): Observable<IUserProfile> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.userProfile.get())
      .get<IUserProfile>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IUserProfile) => {
          if (resp) {
            resp.firstName = resp.firstName ?? null;
            resp.lastName = resp.lastName ?? null;
            resp.joiningDate = this.toDateTime(resp.joiningDate) ?? null;
          }

          return resp;
        })
      );
  }

  public update(model: UpdateUserProfileDto): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.userProfile.update())
      .withBody({ ...model })
      .put<boolean>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
