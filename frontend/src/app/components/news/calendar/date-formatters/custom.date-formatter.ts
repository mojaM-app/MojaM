import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { formatDate } from '@angular/common';
import { Injectable, OnDestroy } from '@angular/core';
import { CalendarDateFormatter, DateAdapter, DateFormatterParams } from 'angular-calendar';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { CultureService } from '../../../../../services/translate/culture.service';

@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter implements OnDestroy {
  readonly breakpoint$ = this._breakpointObserver
    .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
    .pipe(distinctUntilChanged());

  private _weekday: 'long' | 'short' | 'narrow' = 'narrow';
  private _subscription: Subscription | undefined = undefined;

  constructor(
    dateAdapter: DateAdapter,
    private _cultureService: CultureService,
    private _breakpointObserver: BreakpointObserver
  ) {
    super(dateAdapter);

    this._subscription = this.breakpoint$.subscribe(value => {
      this.breakpointChanged(value);
    });
  }

  public ngOnDestroy(): void {
    if (this._subscription) {
      this._subscription.unsubscribe();
      this._subscription = undefined;
    }
  }

  public override monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return date.toLocaleDateString(locale, {
      weekday: this._weekday,
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

  private breakpointChanged(arg: any): void {
    if (this._breakpointObserver.isMatched(Breakpoints.Large)) {
      this._weekday = 'long';
    } else if (this._breakpointObserver.isMatched(Breakpoints.Medium)) {
      this._weekday = 'short';
    } else if (this._breakpointObserver.isMatched(Breakpoints.Small)) {
      this._weekday = 'short';
    } else if (this._breakpointObserver.isMatched('(min-width: 500px)')) {
      this._weekday = 'narrow';
    }
  }
}
