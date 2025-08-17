/* eslint-disable @angular-eslint/no-forward-ref */
import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IBulletinPropertiesForm } from '../bulletin.form';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from 'src/pipes/pipes.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { WysiwygFormFieldComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-form-field/wysiwyg-form-field.component';
import { DialogService } from 'src/services/dialog/dialog.service';
import { IntroductionHelpDialogComponent } from '../help-dialogs/introduction-help-dialog/introduction-help-dialog.component';
import { TipsForWordHelpDialogComponent } from '../help-dialogs/tips-for-word-help-dialog/tips-for-word-help-dialog.component';
import { DailyPrayerHelpDialogComponent } from '../help-dialogs/daily-prayer-help-dialog/daily-prayer-help-dialog.component';
import { BaseTabBulletin } from '../base-tab-bulletin';

@Component({
  selector: 'app-tab-bulletin-properties',
  imports: [
    CommonModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    forwardRef(() => WysiwygFormFieldComponent),
  ],
  providers: [],
  templateUrl: './tab-bulletin-properties.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBulletinPropertiesComponent extends BaseTabBulletin {
  public readonly formGroup = input.required<FormGroup<IBulletinPropertiesForm>>();

  public constructor(private readonly _dialogService: DialogService) {
    super();
  }

  protected openIntroductionHelpDialog(): void {
    this._dialogService.openComponentDialog(
      IntroductionHelpDialogComponent,
      undefined,
      this.helpDialogConfig
    );
  }

  protected openTipsForWorkHelpDialog(): void {
    this._dialogService.openComponentDialog(
      TipsForWordHelpDialogComponent,
      undefined,
      this.helpDialogConfig
    );
  }

  protected openDailyPrayerHelpDialog(): void {
    this._dialogService.openComponentDialog(
      DailyPrayerHelpDialogComponent,
      undefined,
      this.helpDialogConfig
    );
  }
}
