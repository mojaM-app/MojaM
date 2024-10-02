import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IAnnouncements } from '../../../../interfaces/news/announcements/announcements';
import { AnnouncementsService } from '../../../../services/common/news/announcements.service';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent extends BaseNewsComponent implements OnInit {
  public announcements: string[] | null = null;
  public announcementsDate: Date | null = null;

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _service: AnnouncementsService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService
  ) {
    super();
  }

  public ngOnInit(): void {
    this._service
      .get()
      .pipe(
        this._spinnerService.waitForSubscription(),
        finalize(() => {
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe((result: IAnnouncements) => {
        this.announcements = result?.announcements ?? [];
        this.announcementsDate = result?.date;
      });
  }
}
