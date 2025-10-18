import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from 'src/services/common/base.service';
import { HttpClientService } from 'src/services/common/httpClient.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ISystemInfo } from '../interfaces/system-info.interface';

@Injectable({
  providedIn: 'root',
})
export class SystemInfoService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public get(): Observable<ISystemInfo> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.systemInfo.get())
      .get<ISystemInfo>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: ISystemInfo): ISystemInfo => {
          if (resp) {
            resp.timestamp = this.toDateTime(resp.timestamp)!;
          }
          console.log('System Info:', resp);
          return resp;
        })
      );
  }
}
