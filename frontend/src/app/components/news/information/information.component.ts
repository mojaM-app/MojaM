import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationComponent extends BaseNewsComponent implements OnInit {

  public constructor() {
    super();
  }

  public ngOnInit(): void {
  }

}
