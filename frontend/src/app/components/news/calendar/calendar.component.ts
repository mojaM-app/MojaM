import { ChangeDetectionStrategy, Component, Injectable } from '@angular/core';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarView,
  DateAdapter,
  DAYS_OF_WEEK,
} from 'angular-calendar';
import { CultureService } from 'src/services/translate/culture.service';
import { BaseNewsComponent } from '../base-news.component';
import { formatDate } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
  readonly breakpoint$ = this.breakpointObserver
    .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
    .pipe(distinctUntilChanged());

  readonly subscription: Subscription;

  private weekday: 'long' | 'short' | 'narrow' = 'narrow';

  constructor(
    dateAdapter: DateAdapter,
    private _cultureService: CultureService,
    private breakpointObserver: BreakpointObserver
  ) {
    super(dateAdapter);

    this.subscription = this.breakpoint$.subscribe(value => {
      return this.breakpointChanged(value);
    });
  }

  public override monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return date.toLocaleDateString(locale, {
      weekday: this.weekday,
      hourCycle: 'h24',
    });
  }

  override dayViewTitle({ date, locale }: DateFormatterParams): string {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  public override weekViewHour({ date, locale }: DateFormatterParams): string {
    return this.dayViewHour({ date, locale });
  }

  public override dayViewHour({ date, locale }: DateFormatterParams): string {
    return formatDate(date, 'HH:mm', locale ?? this._cultureService.currentCulture);
  }

  override weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return this.monthViewColumnHeader({ date, locale });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private breakpointChanged(arg: any): void {
    if (this.breakpointObserver.isMatched(Breakpoints.Large)) {
      this.weekday = 'long';
    } else if (this.breakpointObserver.isMatched(Breakpoints.Medium)) {
      this.weekday = 'short';
    } else if (this.breakpointObserver.isMatched(Breakpoints.Small)) {
      this.weekday = 'short';
    } else if (this.breakpointObserver.isMatched('(min-width: 500px)')) {
      this.weekday = 'narrow';
    }
  }
}

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
export class CalendarComponent extends BaseNewsComponent {
  CalendarView = CalendarView;
  public view: CalendarView = CalendarView.Month;
  public viewDate = new Date();
  public events: CalendarEvent[] = [];
  public weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  public weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];

  public constructor(
    public cultureService: CultureService,
    private dateAdapter: DateAdapter
  ) {
    super();
  }

  public setView(view: CalendarView): void {
    this.view = view;
  }

  public setNextView(): void {
    this.setNewViewDate();
  }

  public setPrevView(): void {
    this.setNewViewDate(true);
  }

  private setNewViewDate(moveBack = false): void {
    const addFn: any = {
      day: this.dateAdapter.addDays,
      week: this.dateAdapter.addWeeks,
      month: this.dateAdapter.addMonths,
    }[this.view];

    this.viewDate = addFn(this.viewDate, moveBack ? -1 : 1);
  }
}
