import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { formatDate } from '@angular/common';
import { Injectable, OnDestroy } from '@angular/core';
import { CalendarDateFormatter, DateAdapter, DateFormatterParams } from 'angular-calendar';
import { distinctUntilChanged } from 'rxjs';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { CultureService } from 'src/services/translate/culture.service';

@Injectable({
  providedIn: 'root',
})
export class CustomDateFormatter
  extends WithUnsubscribe(CalendarDateFormatter)
  implements OnDestroy
{
  private readonly _breakpoint$ = this._breakpointObserver
    .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
    .pipe(distinctUntilChanged());

  private _weekday: 'long' | 'short' | 'narrow' = 'narrow';

  public constructor(
    dateAdapter: DateAdapter,
    private _cultureService: CultureService,
    private _breakpointObserver: BreakpointObserver
  ) {
    super(dateAdapter);

    this.addSubscription(
      this._breakpoint$.subscribe(() => {
        this.breakpointChanged();
      })
    );
  }

  public override monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return date.toLocaleDateString(locale, {
      weekday: this._weekday,
      hourCycle: 'h24',
    });
  }

  public override dayViewTitle({ date, locale }: DateFormatterParams): string {
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

  public override weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return this.monthViewColumnHeader({ date, locale });
  }

  private breakpointChanged(): void {
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
