import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { AnnouncementsService } from 'src/services/common/news/announcements.service';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent
  extends BaseNewsComponent
  implements OnInit
{
  public announcements: string[] | null = null;

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
      .subscribe((result: string[]) => {
        if (result?.length) {
          this.announcements = result;
        } else {
          this.announcements = [];
        }
      });
  }
}
