import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent extends BaseNewsComponent implements OnInit {

  public constructor() {
    super();
  }

  public ngOnInit(): void {}
}
