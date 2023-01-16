import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MissionService } from 'src/services/common/community/mission.service';

@Component({
  selector: 'app-community-mission',
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionComponent implements OnInit {
  public isLoading: boolean = false;
  public content: string | null = null;

  public constructor(
    private _service: MissionService,
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
      .subscribe((result) => {
        this.content = result;
      });
  }
}
