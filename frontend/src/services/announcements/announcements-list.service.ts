import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';
import { AnnouncementsGridData } from 'src/interfaces/announcements/announcements-list.interfaces';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';
import { SpinnerService } from '../spinner/spinner.service';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsListService extends BaseService {
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
  ): Observable<AnnouncementsGridData | null> {
    return this._httpClient
      .request()
      .withParams({
        column: sortColumn,
        direction: sortDirection,
        pageIndex,
        pageSize,
      })
      .withUrl(this.API_ROUTES.announcementsList.get())
      .get<AnnouncementsGridData>()
      .pipe(this._spinnerService.waitForSubscription());
  }
}
