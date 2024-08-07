import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { DiaconieService } from '../../../../services/common/community/diaconie.service';

@Component({
  selector: 'app-community-diaconie',
  templateUrl: './diaconie.component.html',
  styleUrls: ['./diaconie.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaconieComponent implements OnInit {
  public isLoading = false;
  public content: string | null = null;

  public constructor(
    private _service: DiaconieService,
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
