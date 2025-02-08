import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { map, Observable } from 'rxjs';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import {
  AnnouncementsGridData,
  IAnnouncementsGridItemDto,
} from '../../announcements/interfaces/announcements-list.interfaces';

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
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: AnnouncementsGridData) => {
          if (resp.items?.length > 0) {
            resp.items.forEach((item: IAnnouncementsGridItemDto) => {
              item.validFromDate = this.toDateTime(item.validFromDate);
              item.createdAt = this.toDateTime(item.createdAt)!;
              item.updatedAt = this.toDateTime(item.updatedAt);
              item.publishedAt = this.toDateTime(item.publishedAt);
              item.itemsCount = parseInt(item.itemsCount as any);
            });
          }
          return resp;
        })
      );
  }
}
