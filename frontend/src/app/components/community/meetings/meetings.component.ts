import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MissionService } from 'src/services/common/mission.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';

@Component({
  selector: 'app-community-meetings',
  templateUrl: './meetings.component.html',
  styleUrls: ['./meetings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingsComponent implements OnInit {
  public content: string | null = null;

  public constructor(
    private _missionService: MissionService,
    private _spinnerService: SpinnerService
  ) {}

  public ngOnInit(): void {
    this._missionService
      .getMeetings()
      .pipe(this._spinnerService.waitForSubscription())
      .subscribe((result) => {
        this.content = result;
      });
  }
}
