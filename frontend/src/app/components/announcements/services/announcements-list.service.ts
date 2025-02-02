import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import {
  AnnouncementsGridData,
  IAnnouncementsGridItemDto,
} from 'src/app/components/announcements/interfaces/announcements-list.interfaces';
import { DeleteResult } from 'src/core/delete-result.enum';
import { ErrorUtils } from 'src/utils/error.utils';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';

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

  public publish(uuid: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.publish(uuid))
      .post<boolean>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map(response => response)
      );
  }

  public delete(uuid: string): Observable<DeleteResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.announcements.delete(uuid))
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
}
