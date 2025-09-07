import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { IBulletinDaySectionForm, IBulletinPropertiesForm } from '../../../bulletin.form';
import { PipesModule } from 'src/pipes/pipes.module';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { errorNames } from 'src/validators/error-names.const';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { MatInputModule } from '@angular/material/input';
import { DaySections } from '../day-sections';
import { WysiwygFormFieldComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-form-field/wysiwyg-form-field.component';
import { SectionType } from 'src/app/components/bulletin/enums/section-type.enum';
import { WysiwygPreviewComponent } from 'src/app/components/static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';
import { TranslationService } from 'src/services/translate/translation.service';
import { DialogService } from 'src/services/dialog/dialog.service';
import { SectionSettingsComponent } from './section-settings/section-settings.component';

@Component({
  selector: 'app-day-section',
  imports: [
    PipesModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    forwardRef(() => WysiwygFormFieldComponent),
    WysiwygPreviewComponent,
  ],
  templateUrl: './day-section.component.html',
  styleUrl: './day-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaySectionComponent {
  public readonly bulletinProperties = input.required<FormGroup<IBulletinPropertiesForm>>();
  public readonly formGroup = model<FormGroup<IBulletinDaySectionForm> | undefined>(undefined);
  public readonly deleteSection = output<void>();

  protected readonly isTitleReadOnly = computed<boolean>(() => {
    const sectionType = this.formGroup()?.controls.type.value;
    return DaySections.isTitleReadOnly(sectionType);
  });

  protected readonly isContentReadOnly = computed<boolean>(() => {
    const sectionType = this.formGroup()?.controls.type.value;
    return DaySections.isContentReadOnly(sectionType);
  });

  protected readonly sectionContent = computed<string>(() => {
    switch (this.formGroup()?.controls.type.value) {
      case SectionType.DAILY_PRAYER:
        return this.bulletinProperties().controls.dailyPrayer.value ?? '';
      case SectionType.INTRODUCTION:
        return this.bulletinProperties().controls.introduction.value ?? '';
      case SectionType.TIPS_FOR_WORK:
        return this.bulletinProperties().controls.tipsForWork.value ?? '';
      default:
        return '';
    }
  });

  protected readonly sectionDefaultTitle = computed<string>(() => {
    const sectionType = this.formGroup()!.controls.type.value;
    const type = DaySections.getTypes().find(s => s.value === sectionType);
    return this._translationService.get(type!.label);
  });

  protected readonly errorNames = errorNames;
  protected readonly maxLengths = VALIDATOR_SETTINGS;

  public constructor(
    private readonly _translationService: TranslationService,
    private readonly _dialogService: DialogService
  ) {}

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  protected onDeleteClick(): void {
    this.deleteSection.emit();
  }

  protected openOptionsDialog(): void {
    this._dialogService.openComponentDialog(
      SectionSettingsComponent,
      {
        settings: this.formGroup()!.controls.settings,
        sectionType: this.formGroup()!.controls.type.value,
        sectionTitle: this.formGroup()!.controls.title.value ?? this.sectionDefaultTitle(),
      },
      {
        title: 'Bulletin/Form/TabBulletinDay/Section/OptionsDialog/Title',
      }
    );
  }
}
