import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { DeleteResult } from 'src/core/delete-result.enum';
import { ErrorUtils } from 'src/utils/error.utils';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import { AddBulletinDto } from '../models/add-bulletin.model';

@Injectable({
  providedIn: 'root',
})
export class BulletinService extends BaseService {
  public constructor(
    private _httpClient: HttpClientService,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  // public get(uuid: string): Observable<IAnnouncements> {
  //   return this._httpClient
  //     .request()
  //     .withUrl(this.API_ROUTES.announcements.get(uuid))
  //     .get<IAnnouncements>()
  //     .pipe(
  //       this._spinnerService.waitForSubscription(),
  //       map((resp: IAnnouncements) => {
  //         if (resp) {
  //           resp.validFromDate = this.toDateTime(resp.validFromDate);
  //           resp.createdAt = this.toDateTime(resp.createdAt)!;
  //           resp.updatedAt = this.toDateTime(resp.updatedAt)!;
  //           resp.publishedAt = this.toDateTime(resp.publishedAt);
  //           resp.items?.forEach(item => {
  //             item.createdAt = this.toDateTime(item.createdAt)!;
  //             item.updatedAt = this.toDateTime(item.updatedAt);
  //             item.getAuthorName = (): string => {
  //               return item.updatedBy ?? item.createdBy ?? '';
  //             };
  //             item.getCreationDateTime = (): Date => {
  //               return item.updatedAt ?? item.createdAt;
  //             };
  //           });
  //           resp.getPublisherName = (): string => {
  //             return resp.publishedBy ?? '';
  //           };
  //           resp.getPublishDateTime = (): Date | undefined | null => {
  //             return resp.publishedAt;
  //           };
  //         }

  //         return resp;
  //       })
  //     );
  // }

  public create(model: AddBulletinDto): Observable<string | null> {
    console.log('BulletinService.create', model);
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletin.create())
      .withBody({ ...model })
      .post<string | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: string | null) => {
          return resp ?? null;
        })
      );
  }

  // public update(model: EditAnnouncementsDto): Observable<string | null> {
  //   return this._httpClient
  //     .request()
  //     .withUrl(this.API_ROUTES.announcements.update(model.id!))
  //     .withBody({ ...model })
  //     .put<string | null>()
  //     .pipe(
  //       this._spinnerService.waitForSubscription(),
  //       map((resp: string | null) => {
  //         return resp ?? null;
  //       })
  //     );
  // }

  // public publish(uuid: string): Observable<boolean> {
  //   return this._httpClient
  //     .request()
  //     .withUrl(this.API_ROUTES.announcements.publish(uuid))
  //     .post<boolean>()
  //     .pipe(
  //       this._spinnerService.waitForSubscription(),
  //       map(response => response)
  //     );
  // }

  // public delete(uuid: string): Observable<DeleteResult> {
  //   return this._httpClient
  //     .request()
  //     .withUrl(this.API_ROUTES.announcements.delete(uuid))
  //     .delete<boolean>()
  //     .pipe(
  //       this._spinnerService.waitForSubscription(),
  //       map(() => DeleteResult.Success),
  //       catchError((error: unknown) => {
  //         if (ErrorUtils.isConflictError(error)) {
  //           return of(DeleteResult.DbFkConstraintError);
  //         }
  //         return throwError(() => error);
  //       })
  //     );
  // }
}
