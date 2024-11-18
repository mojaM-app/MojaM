import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IDialogSettings } from 'src/interfaces/common/dialog.settings';
import { PipesModule } from 'src/pipes/pipes.module';
import { TranslationService } from 'src/services/translate/translation.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIconModule,
    PipesModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  public readonly settings: WritableSignal<IDialogSettings>;

  public constructor(
    @Inject(MAT_DIALOG_DATA) data: IDialogSettings,
    private _dialogRef: MatDialogRef<ConfirmDialogComponent>,
    translationService: TranslationService
  ) {
    data.title = translationService.get(data.title ?? 'ConfirmDialog/DefaultTitle');
    data.text = data.text?.length > 0 ? translationService.get(data.text) : '';
    data.noBtnText = translationService.get(data.noBtnText ?? 'Shared/BtnNo');
    data.yesBtnText = translationService.get(data.yesBtnText ?? 'Shared/BtnYes');
    this.settings = signal(data);
  }

  public noClick(): void {
    this._dialogRef.close(false);
  }

  public yesClick(): void {
    this._dialogRef.close(true);
  }
}
