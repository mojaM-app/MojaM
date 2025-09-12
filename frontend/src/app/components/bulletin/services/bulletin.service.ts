import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { DeleteResult } from 'src/core/delete-result.enum';
import { ErrorUtils } from 'src/utils/error.utils';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import { AddBulletinDto } from '../models/add-bulletin.model';
import { EditBulletinDto } from '../models/edit-bulletin.model';
import { IBulletin } from '../interfaces/bulletin';
import { SectionType } from '../enums/section-type.enum';

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

  public get(uuid: string): Observable<IBulletin> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletin.get(uuid))
      .get<IBulletin>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IBulletin) => {
          if (resp) {
            resp.date = this.toDateTime(resp.date) ?? null;
            resp.createdAt = this.toDateTime(resp.createdAt)!;
            resp.updatedAt = this.toDateTime(resp.updatedAt)!;
            resp.publishedAt = this.toDateTime(resp.publishedAt) ?? null;
            resp.days = resp.days?.map(day => {
              day.date = this.toDateTime(day.date) ?? null;
              return day;
            });
          }

          return resp;
        })
      );
  }

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

  public update(model: EditBulletinDto): Observable<string | null> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletin.update(model.id!))
      .withBody({ ...model })
      .put<string | null>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: string | null) => {
          return resp ?? null;
        })
      );
  }

  public publish(uuid: string): Observable<boolean> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletin.publish(uuid))
      .post<boolean>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map(response => response)
      );
  }

  public delete(uuid: string): Observable<DeleteResult> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletin.delete(uuid))
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
