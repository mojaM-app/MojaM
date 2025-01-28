import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';

@Component({
  selector: 'app-information',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NewsComponent {
  public constructor(@Inject(IS_MOBILE) public isMobile: boolean) {}
}
