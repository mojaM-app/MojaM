import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';
import { SpinnerService } from '../../../../services/spinner/spinner.service';
import {
  IBulletinCalendarDay,
  IBulletinCalendarDayDto,
  IBulletinCalendarDayWithSectionsDto,
  IBulletinDaysMinMaxDto,
} from '../interfaces/bulletin-calendar-view.interfaces';
import { TranslationService } from 'src/services/translate/translation.service';
import { SectionType } from '../enums/section-type.enum';
import { DaySections } from '../bulletin-form/tab-bulletin-day/day-sections/day-sections';

@Injectable({
  providedIn: 'root',
})
export class BulletinCalendarViewService extends BaseService {
  public constructor(
    private readonly _httpClient: HttpClientService,
    private readonly _spinnerService: SpinnerService,
    private readonly _translationService: TranslationService
  ) {
    super();
  }

  public getMinMaxDate(): Observable<IBulletinDaysMinMaxDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletinCalendarView.getMinMaxDate())
      .get<IBulletinDaysMinMaxDto>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IBulletinDaysMinMaxDto) => {
          if (resp) {
            resp.minDate = this.toDate(resp.minDate)!;
            resp.maxDate = this.toDate(resp.maxDate)!;
          }
          return resp;
        })
      );
  }

  public getDays(start: Date, end: Date): Observable<IBulletinCalendarDay[]> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletinCalendarView.getDays())
      .withParams({ start: start.toISOString(), end: end.toISOString() })
      .get<IBulletinCalendarDayDto[]>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((days: IBulletinCalendarDayDto[]) => {
          return days.map(dto => {
            return {
              id: dto.id,
              bulletinId: dto.bulletinId,
              title: dto.title,
              start: this.toDate(dto.date)!,
              end: this.toDate(dto.date)!,
              allDay: true,
            } satisfies IBulletinCalendarDay;
          });
        })
      );
  }

  public getDay(id: string): Observable<IBulletinCalendarDayWithSectionsDto> {
    return this._httpClient
      .request()
      .withUrl(this.API_ROUTES.bulletinCalendarView.getDay(id))
      .get<IBulletinCalendarDayWithSectionsDto>()
      .pipe(
        this._spinnerService.waitForSubscription(),
        map((resp: IBulletinCalendarDayWithSectionsDto) => {
          if (resp) {
            resp.date = this.toDate(resp.date)!;
            resp.sections = resp.sections.map(section => {
              return {
                ...section,
                title: this.getSectionTitle(section),
              };
            });
          }
          return resp;
        })
      );
  }

  private getSectionTitle(section: { type: SectionType; title: string | null }): string {
    const type = DaySections.getTypes().find(s => s.value === section.type);

    switch (section.type) {
      case SectionType.INTRODUCTION:
      case SectionType.DAILY_PRAYER:
      case SectionType.TIPS_FOR_WORK:
        return this._translationService.get(type!.label);

      default:
        return section.title ?? this._translationService.get(type!.label);
    }
  }
}
