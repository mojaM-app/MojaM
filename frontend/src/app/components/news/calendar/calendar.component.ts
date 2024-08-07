import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CalendarDateFormatter, CalendarEvent, CalendarView, DateAdapter, DAYS_OF_WEEK } from 'angular-calendar';
import { CultureService } from '../../../../services/translate/culture.service';
import { BaseNewsComponent } from '../base-news.component';
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
export class CalendarComponent extends BaseNewsComponent {
  CalendarView = CalendarView;
  public view: CalendarView = CalendarView.Month;
  public viewDate = new Date();
  public events: CalendarEvent[] = [];
  public weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  public weekendDays: number[] = [DAYS_OF_WEEK.SATURDAY, DAYS_OF_WEEK.SUNDAY];

  public constructor(
    public cultureService: CultureService,
    private _dateAdapter: DateAdapter
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
    const addFn: (date: Date | number, amount: number) => Date = {
      day: this._dateAdapter.addDays,
      week: this._dateAdapter.addWeeks,
      month: this._dateAdapter.addMonths,
    }[this.view];

    this.viewDate = addFn(this.viewDate, moveBack ? -1 : 1);
  }
}
