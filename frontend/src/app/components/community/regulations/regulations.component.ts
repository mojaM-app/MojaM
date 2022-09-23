import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { finalize } from 'rxjs';
import { RegulationsService } from 'src/services/common/community/regulations.service';

@Component({
  selector: 'app-community-regulations',
  templateUrl: './regulations.component.html',
  styleUrls: ['./regulations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegulationsComponent implements OnInit {
  public isLoading: boolean = false;
  public content: string | null = null;

  public constructor(
    private _service: RegulationsService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.isLoading = true;

    this._service
      .get()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((result) => {
        this.content = result;
        this._changeDetectorRef.detectChanges();
      });
  }
}
