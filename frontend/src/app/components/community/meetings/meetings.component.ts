import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { MeetingsService } from 'src/services/community/meetings.service';

@Component({
  selector: 'app-community-meetings',
  templateUrl: './meetings.component.html',
  styleUrls: ['./meetings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsComponent implements OnInit {
  public isLoading = false;
  public content: string | null = null;

  public constructor(
    private _service: MeetingsService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.isLoading = true;

    this._service
      .get()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this._changeDetectorRef.detectChanges();
        })
      )
      .subscribe(result => {
        this.content = result;
      });
  }
}
