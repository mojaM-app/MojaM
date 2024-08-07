import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { StructureService } from '../../../../services/common/community/structure.service';

@Component({
  selector: 'app-community-structure',
  templateUrl: './structure.component.html',
  styleUrls: ['./structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureComponent implements OnInit {
  public isLoading = false;
  public content: string | null = null;

  public constructor(
    private _service: StructureService,
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
