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
  CalendarEventTitleFormatter,
  CalendarMonthViewComponent,
  CalendarView,
  CalendarWeekViewComponent,
  DateAdapter,
  DAYS_OF_WEEK,
} from 'angular-calendar';
import { ViewPeriod } from 'calendar-utils';
import { debounceTime } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { CalendarService } from 'src/app/components/calendar/services/calendar.service';
import { ICalendarEvent } from 'src/app/components/calendar/interfaces/calendar-event';
import { DialogService } from 'src/services/dialog/dialog.service';
import { CultureService } from 'src/services/translate/culture.service';
import { CustomDateFormatter } from './date-formatters/custom.date.formatter';
import { CustomEventTitleFormatter } from './event-formatters/custom.event-title.formatter';
import { EventPreviewComponent } from './event-preview/event-preview.component';
import { PullToRefreshService } from 'src/services/pull-to-refresh/pull-to-refresh.service';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';

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
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter,
    },
  ],
  standalone: false,
})
export class CalendarComponent extends WithUnsubscribe() {
  protected readonly weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  protected readonly weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];

  protected readonly CalendarView = CalendarView;
  protected readonly view = signal<CalendarView>(CalendarView.Month);
  protected readonly viewDate = signal<Date>(new Date());
  protected readonly events = signal<ICalendarEvent[]>([]);
  protected readonly locale = signal<string>(CultureService.DefaultCulture);

  private readonly _calendarMonth = viewChild(CalendarMonthViewComponent);
  private readonly _calendarWeek = viewChild(CalendarWeekViewComponent);
  private readonly _calendarDay = viewChild(CalendarDayViewComponent);

  public constructor(
    @Inject(IS_MOBILE) protected readonly isMobile: boolean,
    private readonly _dateAdapter: DateAdapter,
    private readonly _calendarService: CalendarService,
    private readonly _dialogService: DialogService,
    cultureService: CultureService,
    pullToRefreshService: PullToRefreshService
  ) {
    super();
    this.locale.set(cultureService.currentCulture);

    effect(() => {
      if (
        (this._calendarMonth() || this._calendarWeek() || this._calendarDay()) &&
        this.viewDate() &&
        this.view()
      ) {
        setTimeout(() => this.onViewChanged(), 100);
      }
    });

    effect(() => {
      if (pullToRefreshService.refresh()) {
        this.onViewChanged();
      }
    });
  }

  protected viewDateChange(date: Date): void {
    this.viewDate.set(date);
  }

  protected setView(view: CalendarView): void {
    this.view.set(view);
  }

  protected setNextView(): void {
    this.setNewViewDate();
  }

  protected setPrevView(): void {
    this.setNewViewDate(true);
  }

  protected showMonthEvent(event: ICalendarEvent): void {
    this._dialogService.open(EventPreviewComponent, {
      data: {
        event: event,
      },
      autoFocus: false,
    });
  }

  protected showWeekDayEvent({
    event,
    sourceEvent,
  }: {
    event: ICalendarEvent;
    sourceEvent: MouseEvent | KeyboardEvent;
  }): void {
    sourceEvent.preventDefault();

    this.showMonthEvent(event);
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
    const component = this._calendarMonth() || this._calendarWeek() || this._calendarDay();
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

    this.addSubscription(
      this._calendarService
        .getEvents(period!.start, period!.end)
        .pipe(debounceTime(200))
        .subscribe((events: ICalendarEvent[]) => {
          this.events.set(events);
        })
    );
  }
}
