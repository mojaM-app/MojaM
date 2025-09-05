import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMonthViewDay,
  CalendarView,
  DateAdapter,
  DAYS_OF_WEEK,
} from 'angular-calendar';
import { CustomDateFormatter } from 'src/app/components/calendar/date-formatters/custom.date.formatter';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { CultureService } from 'src/services/translate/culture.service';
import { IBulletinCalendarDay } from '../../interfaces/bulletin-calendar-view.interfaces';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import {
  subMonths,
  addMonths,
  addDays,
  addWeeks,
  subDays,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { DateUtils } from 'src/utils/date.utils';
import { BulletinCalendarViewService } from '../../services/bulletin-calendar-view.service';

@Component({
  selector: 'app-bulletin-views-calendar',
  imports: [CalendarModule, MatIconModule, MatButtonModule, PipesModule, DirectivesModule],
  templateUrl: './bulletin-views-calendar.component.html',
  styleUrl: './bulletin-views-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
    // {
    //   provide: CalendarEventTitleFormatter,
    //   useClass: CustomEventTitleFormatter,
    // },
  ],
})
export class BulletinViewsCalendarComponent extends WithUnsubscribe() {
  protected readonly weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  protected readonly weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];
  protected readonly locale = signal<string>(CultureService.DefaultCulture);
  protected readonly viewDate = signal<Date>(new Date());
  protected readonly events = signal<IBulletinCalendarDay[]>([]);
  protected readonly view = signal<CalendarView>(CalendarView.Month);
  protected readonly btnPrevDisabled = signal<boolean>(false);
  protected readonly btnNextDisabled = signal<boolean>(false);
  private readonly _minDate = signal<Date>(new Date(0));
  private readonly _maxDate = signal<Date>(new Date(0));

  public constructor(
    private readonly _dateAdapter: DateAdapter,
    cultureService: CultureService,
    private readonly _bulletinCalendarViewService: BulletinCalendarViewService
  ) {
    super();
    this.locale.set(cultureService.currentCulture);

    const { firstDay, lastDay } = DateUtils.getMonthBounds();
    this._minDate.set(firstDay);
    this._maxDate.set(lastDay);
    this.dateOrViewChanged();

    this.addSubscription(
      this._bulletinCalendarViewService.getMinMaxDate().subscribe(resp => {
        if (resp) {
          this._minDate.set(resp.minDate);
          this._maxDate.set(resp.maxDate);
          this.dateOrViewChanged();
        }
      })
    );
  }

  protected viewDateChange(date: Date): void {
    this.viewDate.set(date);
    this.dateOrViewChanged();
  }

  protected setNextView(): void {
    if (this.btnNextDisabled()) {
      return;
    }
    this.setNewViewDate();
  }

  protected setPrevView(): void {
    if (this.btnPrevDisabled()) {
      return;
    }
    this.setNewViewDate(true);
  }

  protected beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    body.forEach(day => {
      if (!this.dateIsValid(day.date)) {
        day.cssClass = 'cal-disabled';
      }
    });
  }

  private setNewViewDate(moveBack = false): void {
    const addFn: (date: Date | number, amount: number) => Date = {
      day: this._dateAdapter.addDays,
      week: this._dateAdapter.addWeeks,
      month: this._dateAdapter.addMonths,
    }[this.view()];

    this.viewDate.set(addFn(this.viewDate(), moveBack ? -1 : 1));
    this.dateOrViewChanged();
  }

  private dateIsValid(date: Date): boolean {
    return date >= this._minDate() && date <= this._maxDate();
  }

  private dateOrViewChanged(): void {
    this.btnPrevDisabled.set(
      !this.dateIsValid(
        this.endOfPeriod(this.view(), this.subPeriod(this.view(), this.viewDate(), 1))
      )
    );
    this.btnNextDisabled.set(
      !this.dateIsValid(
        this.startOfPeriod(this.view(), this.addPeriod(this.view(), this.viewDate(), 1))
      )
    );
    if (this.viewDate < this._minDate) {
      this.viewDateChange(this._minDate());
    } else if (this.viewDate > this._maxDate) {
      this.viewDateChange(this._maxDate());
    }
  }

  private endOfPeriod(period: CalendarView, date: Date): Date {
    return {
      day: endOfDay,
      week: endOfWeek,
      month: endOfMonth,
    }[period](date);
  }

  private startOfPeriod(period: CalendarView, date: Date): Date {
    return {
      day: startOfDay,
      week: startOfWeek,
      month: startOfMonth,
    }[period](date);
  }

  private addPeriod(period: CalendarView, date: Date, amount: number): Date {
    return {
      day: addDays,
      week: addWeeks,
      month: addMonths,
    }[period](date, amount);
  }

  private subPeriod(period: CalendarView, date: Date, amount: number): Date {
    return {
      day: subDays,
      week: subWeeks,
      month: subMonths,
    }[period](date, amount);
  }
}
