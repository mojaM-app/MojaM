import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';

@Component({
  selector: 'app-bulletin-views',
  templateUrl: './bulletin-views.component.html',
  styleUrl: './bulletin-views.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BulletinViewsComponent extends WithUnsubscribe() {
  public constructor(@Inject(IS_MOBILE) protected isMobile: boolean) {
    super();
  }
}
