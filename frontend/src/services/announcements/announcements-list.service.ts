import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { map, Observable } from 'rxjs';
import {
  AnnouncementsGridData,
  IAnnouncementsGridItemDto,
} from 'src/interfaces/announcements/announcements-list.interfaces';
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
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: AnnouncementsGridData) => {
          if (resp.items?.length > 0) {
            resp.items.forEach((item: IAnnouncementsGridItemDto) => {
              item.validFromDate = item.validFromDate ? new Date(item.validFromDate) : undefined;
              item.createdAt = new Date(item.createdAt);
              item.updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;
              item.publishedAt = item.publishedAt ? new Date(item.publishedAt) : undefined;
              item.itemsCount = parseInt(item.itemsCount as any);
            });
          }
          return resp;
        })
      );
  }
}
