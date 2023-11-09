import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationComponent extends BaseNewsComponent {
  public constructor() {
    super();
  }
}
