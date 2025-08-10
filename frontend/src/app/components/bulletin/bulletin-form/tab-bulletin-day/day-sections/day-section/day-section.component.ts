import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
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

  protected readonly isTitleReadOnly = computed(() => {
    const sectionType = this.formGroup()?.controls.type.value;
    return DaySections.isTitleReadOnly(sectionType);
  });

  protected readonly isContentReadOnly = computed(() => {
    const sectionType = this.formGroup()?.controls.type.value;
    return DaySections.isContentReadOnly(sectionType);
  });

  protected readonly errorNames = errorNames;
  protected readonly maxLengths = VALIDATOR_SETTINGS;

  protected getControlErrors(control: AbstractControl): ValidationErrors {
    return control?.errors ?? {};
  }

  protected getSectionContent(): string {
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
  }
}
