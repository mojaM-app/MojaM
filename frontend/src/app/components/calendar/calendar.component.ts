import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  CalendarDateFormatter,
  CalendarDayViewComponent,
  CalendarEvent,
  CalendarMonthViewComponent,
  CalendarView,
  CalendarWeekViewComponent,
  DateAdapter,
  DAYS_OF_WEEK,
} from 'angular-calendar';
import { ViewPeriod } from 'calendar-utils';
import { debounceTime } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { CalendarService } from 'src/services/calendar/calendar.service';
import { CultureService } from 'src/services/translate/culture.service';
import { CustomDateFormatter } from './date-formatters/custom.date-formatter';

//https://mattlewis92.github.io/angular-calendar/#/kitchen-sink
@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
  ],
})
export class CalendarComponent {
  public readonly weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  public readonly weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];

  public CalendarView = CalendarView;
  public view = signal<CalendarView>(CalendarView.Month);
  public viewDate = signal<Date>(new Date());
  public events = signal<CalendarEvent[]>([]);
  public locale = signal<string>(CultureService.DefaultCulture);

  private calendarMonth = viewChild(CalendarMonthViewComponent);
  private calendarWeek = viewChild(CalendarWeekViewComponent);
  private calendarDay = viewChild(CalendarDayViewComponent);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    cultureService: CultureService,
    private _dateAdapter: DateAdapter,
    private _calendarService: CalendarService
  ) {
    this.locale.set(cultureService.currentCulture);

    effect(() => {
      if (
        (this.calendarMonth() || this.calendarWeek() || this.calendarDay()) &&
        this.viewDate() &&
        this.view()
      ) {
        setTimeout(() => this.onViewChanged(), 100);
      }
    });
  }

  public viewDateChange(date: Date): void {
    this.viewDate.set(date);
  }

  public setView(view: CalendarView): void {
    this.view.set(view);
  }

  public setNextView(): void {
    this.setNewViewDate();
  }

  public setPrevView(): void {
    this.setNewViewDate(true);
  }

  private setNewViewDate(moveBack = false): void {
    const addFn: (date: Date | number, amount: number) => Date = {
      day: this._dateAdapter.addDays,
      week: this._dateAdapter.addWeeks,
      month: this._dateAdapter.addMonths,
    }[this.view()];

    this.viewDate.set(addFn(this.viewDate(), moveBack ? -1 : 1));
  }

  private onViewChanged(): void {
    const component = this.calendarMonth() || this.calendarWeek() || this.calendarDay();
    const viewDate = this.viewDate();
    switch (this.view()) {
      case CalendarView.Month:
        this.updateCalendarEvents((component as CalendarMonthViewComponent)?.view?.period);
        break;
      case CalendarView.Week:
        this.updateCalendarEvents((component as CalendarWeekViewComponent)?.view?.period);
        break;
      case CalendarView.Day:
        this.updateCalendarEvents({
          start: this._dateAdapter.startOfDay(viewDate),
          end: this._dateAdapter.endOfDay(viewDate),
          events: [],
        } satisfies ViewPeriod);
        break;
    }
  }

  private updateCalendarEvents(period?: ViewPeriod): void {
    if (!period) {
      return;
    }

    this._calendarService
      .getEvents(period!.start, period!.end)
      .pipe(debounceTime(200))
      .subscribe((events: CalendarEvent[]) => {
        this.events.set(events);
      });
  }
}
