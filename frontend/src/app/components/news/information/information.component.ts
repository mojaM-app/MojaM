import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationComponent extends BaseNewsComponent {
  public constructor(@Inject(IS_MOBILE) public isMobile: boolean) {
    super();
  }
}
