import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { map, Observable } from 'rxjs';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import { BulletinGridData, IBulletinGridItemDto } from '../interfaces/bulletin-list.interfaces';

@Injectable({
  providedIn: 'root',
})
export class BulletinListService extends BaseService {
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
  ): Observable<BulletinGridData | null> {
    return this._httpClient
      .request()
      .withParams({
        column: sortColumn,
        direction: sortDirection,
        pageIndex,
        pageSize,
      })
      .withUrl(this.API_ROUTES.bulletinList.get())
      .get<BulletinGridData>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: BulletinGridData) => {
          if (resp.items?.length > 0) {
            resp.items.forEach((item: IBulletinGridItemDto) => {
              item.date = this.toDateTime(item.date);
              item.createdAt = this.toDateTime(item.createdAt)!;
              item.updatedAt = this.toDateTime(item.updatedAt)!;
              item.publishedAt = this.toDateTime(item.publishedAt);
            });
          }

          return resp;
        })
      );
  }
}
