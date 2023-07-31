import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarView,
  DateAdapter,
  DAYS_OF_WEEK,
} from 'angular-calendar';
import { CultureService } from 'src/services/translate/culture.service';
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
export class CalendarComponent extends BaseNewsComponent implements OnInit {
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

  public ngOnInit(): void {}

  public setView(view: CalendarView): void {
    this.view = view;
  }

  public setNextView(): void {
    this.setNewViewDate();
  }

  public setPrevView(): void {
    this.setNewViewDate(true);
  }

  private setNewViewDate(moveBack: boolean = false): void {
    const addFn: any = {
      day: this.dateAdapter.addDays,
      week: this.dateAdapter.addWeeks,
      month: this.dateAdapter.addMonths,
    }[this.view];

    this.viewDate = addFn(this.viewDate, moveBack ? -1 : 1);
  }
}
