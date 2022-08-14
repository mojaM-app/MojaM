import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { MissionService } from 'src/services/common/mission.service';

@Component({
  selector: 'app-community-meetings',
  templateUrl: './meetings.component.html',
  styleUrls: ['./meetings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsComponent implements OnInit {
  public isLoading : boolean = false;
  public content: string | null = null;

  public constructor(
    private _missionService: MissionService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.isLoading = true;

    this._missionService
      .getMeetings()
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe((result) => {
        this.content = result;
        this._changeDetectorRef.detectChanges();
      });
  }
}
