import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';
import { BulletinView } from '../enums/bulletin-view.enum';

@Component({
  selector: 'app-bulletin-views',
  templateUrl: './bulletin-views.component.html',
  styleUrl: './bulletin-views.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BulletinViewsComponent {
  protected BulletinView = BulletinView;
  protected view = signal<BulletinView>(BulletinView.Calendar);

  public constructor(@Inject(IS_MOBILE) protected readonly isMobile: boolean) {}
}
