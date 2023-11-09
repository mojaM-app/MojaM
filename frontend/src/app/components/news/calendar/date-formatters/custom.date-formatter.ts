import { Injectable } from '@angular/core';
import { CalendarDateFormatter, DateAdapter, DateFormatterParams } from 'angular-calendar';
import { CultureService } from 'src/services/translate/culture.service';
import { formatDate } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
  readonly breakpoint$ = this.breakpointObserver
    .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
    .pipe(
      distinctUntilChanged()
    );

  private _weekday: 'long' | 'short' | 'narrow' = 'narrow';

  constructor(
    dateAdapter: DateAdapter,
    private _cultureService: CultureService,
    private breakpointObserver: BreakpointObserver
  ) {
    super(dateAdapter);

    this.breakpoint$
    .pipe(
      untilDestroyed(this)
    )
    .subscribe(value => {
      this.breakpointChanged(value);
    });
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
    if (this.breakpointObserver.isMatched(Breakpoints.Large)) {
      this._weekday = 'long';
    } else if (this.breakpointObserver.isMatched(Breakpoints.Medium)) {
      this._weekday = 'short';
    } else if (this.breakpointObserver.isMatched(Breakpoints.Small)) {
      this._weekday = 'short';
    } else if (this.breakpointObserver.isMatched('(min-width: 500px)')) {
      this._weekday = 'narrow';
    }
  }
}
