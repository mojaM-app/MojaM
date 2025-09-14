import { ChangeDetectionStrategy, Component, Inject, OnInit, signal } from '@angular/core';
import { DirectivesModule } from 'src/directives/directives.module';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CardHeaderComponent } from 'src/app/components/static/card-header/card-header.component';
import { PipesModule } from 'src/pipes/pipes.module';
import { IS_MOBILE } from 'src/app/app.config';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinMenu } from '../../bulletin.menu';
import { GuidUtils } from 'src/utils/guid.utils';
import { BulletinCalendarViewService } from '../../services/bulletin-calendar-view.service';
import { IBulletinCalendarDayWithSectionsDto } from '../../interfaces/bulletin-calendar-view.interfaces';
import { MatExpansionModule } from '@angular/material/expansion';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';

@Component({
  selector: 'app-bulletin-day',
  imports: [
    CommonModule,
    CardHeaderComponent,
    PipesModule,
    DirectivesModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    WysiwygPreviewComponent,
  ],
  templateUrl: './bulletin-day.component.html',
  styleUrl: './bulletin-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulletinDayComponent extends WithUnsubscribe() implements OnInit {
  protected readonly bulletinDay = signal<IBulletinCalendarDayWithSectionsDto | null>(null);

  public constructor(
    @Inject(IS_MOBILE) protected isMobile: boolean,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _bulletinCalendarViewService: BulletinCalendarViewService
  ) {
    super();
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (!GuidUtils.isValidGuid(id)) {
      this.navigateToBulletin();
      return;
    }

    this.addSubscription(
      this._bulletinCalendarViewService
        .getDay(id)
        .subscribe((day: IBulletinCalendarDayWithSectionsDto) => {
          if (day && GuidUtils.isValidGuid(day.id)) {
            this.bulletinDay.set(day);
          } else {
            this.navigateToBulletin();
          }
        })
    );
  }

  protected back(): void {
    window.history.back();
  }

  protected navigateToBulletin(): void {
    this._router.navigateByUrl(BulletinMenu.Path);
  }
}
