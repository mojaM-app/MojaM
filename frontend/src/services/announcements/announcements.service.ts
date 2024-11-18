import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AddAnnouncementsDto } from 'src/app/components/announcements/models/add-announcements.model';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { SpinnerService } from '../spinner/spinner.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public create(model: AddAnnouncementsDto): Observable<string | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.create())
      .withBody({ ...model })
      .post<string | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: string | null) => {
          return resp ?? null;
        })
      );
  }
}
