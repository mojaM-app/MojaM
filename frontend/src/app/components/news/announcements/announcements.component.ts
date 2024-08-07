import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
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
    private _service: AnnouncementsService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    super();
  }

  public ngOnInit(): void {
    this._service
      .get()
      .pipe(
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
