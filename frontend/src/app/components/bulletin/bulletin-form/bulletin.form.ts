import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { BulletinDaySectionDto, BulletinDto } from '../models/bulletin.model';
import { SectionType } from '../enums/section-type.enum';
import { conditionalValidator } from 'src/validators/conditional.validator';
import { DaySections } from './tab-bulletin-day/day-sections/day-sections';

export interface IBulletinSectionSettingsForm {
  includeInPdf: FormControl<boolean>;
  expanded: FormControl<boolean>;
}

export interface IBulletinDaySettingsForm {
  showTitleInPdf: FormControl<boolean>;
}

export interface IBulletinDaySectionForm {
  id: FormControl<string | undefined>;
  type: FormControl<SectionType | null>;
  title: FormControl<string | null>;
  content: FormControl<string | null>;
  settings: FormGroup<IBulletinSectionSettingsForm>;
}

export interface IBulletinDayForm {
  id: FormControl<string | undefined>;
  date: FormControl<Date | null>;
  title: FormControl<string | null>;
  settings: FormGroup<IBulletinDaySettingsForm>;
  sections: FormArray<FormGroup<IBulletinDaySectionForm>>;
}

export interface IBulletinPropertiesForm {
  date: FormControl<Date | null>;
  number: FormControl<string | null>;
  title: FormControl<string | null>;
  introduction: FormControl<string | null>;
  tipsForWork: FormControl<string | null>;
  dailyPrayer: FormControl<string | null>;
}

export interface IBulletinForm {
  properties: FormGroup<IBulletinPropertiesForm>;
  days: FormArray<FormGroup<IBulletinDayForm>>;
}

@Injectable({
  providedIn: 'root',
})
export class BulletinFormBuilder {
  private readonly _form: FormGroup<IBulletinForm>;
  public get form(): FormGroup<IBulletinForm> {
    return this._form;
  }

  public get days(): FormArray<FormGroup<IBulletinDayForm>> {
    return this._form.controls.days;
  }

  public constructor(private _formBuilder: FormBuilder) {
    this._form = this.create();
  }

  public addNewDay(copySectionsFromPreviousDay: boolean): void {
    const newDay = this.getNewDayFormGroup();
    const lastDay = this.days.length > 0 ? this.days.at(this.days.length - 1) : null;
    if (lastDay) {
      if (lastDay.controls.date.value) {
        const lastDate = new Date(lastDay.controls.date.value);
        lastDate.setDate(lastDate.getDate() + 1);
        newDay.controls.date.setValue(lastDate);
      }

      if (copySectionsFromPreviousDay) {
        lastDay.controls.sections.controls.forEach(section => {
          const newSection = this.createDaySection({
            type: section.controls.type.value!,
            title: section.controls.title.value,
            content: section.controls.content.value,
            settings: {
              includeInPdf: section.controls.settings.controls.includeInPdf.value,
              expanded: section.controls.settings.controls.expanded.value,
            },
          });
          newDay.controls.sections.push(newSection);
        });
      }
    }
    this._form.controls.days.push(newDay);
  }

  public setFormValues(model: BulletinDto | undefined | null): void {
    if (!model) {
      return;
    }

    this._form.controls.properties.patchValue({
      date: model.date ?? null,
      title: model.title ?? null,
      number: model.number ?? null,
      introduction: model.introduction ?? null,
      dailyPrayer: model.dailyPrayer ?? null,
      tipsForWork: model.tipsForWork ?? null,
    });

    this._form.controls.days.clear();

    (model.days ?? []).forEach(day => {
      const dayGroup = this.getNewDayFormGroup();

      dayGroup.patchValue({
        id: day.id,
        date: day.date ?? null,
        title: day.title ?? null,
        settings: {
          showTitleInPdf: day.settings?.showTitleInPdf ?? false,
        },
      });

      const sectionsArray = dayGroup.controls.sections;

      (day.sections ?? []).forEach(section => {
        const sectionGroup = this.getNewSectionFormGroup();
        sectionGroup.patchValue({
          id: section.id,
          title: section.title ?? null,
          type: section.type ?? DaySections.defaultSectionType,
          content: section.content ?? null,
          settings: {
            includeInPdf:
              section.settings?.includeInPdf ?? DaySections.isIncludeInPdfByDefault(section.type),
            expanded: section.settings?.expanded ?? DaySections.isExpandedByDefault(section.type),
          },
        });
        sectionsArray.push(sectionGroup);
      });

      this._form.controls.days.push(dayGroup);
    });
  }

  public isValid(): boolean {
    //TODO: Implement validation logic if needed

    return true;
  }

  public createDaySection(
    section: Partial<BulletinDaySectionDto>
  ): FormGroup<IBulletinDaySectionForm> {
    const formGroup = this.getNewSectionFormGroup();

    formGroup.patchValue({
      id: section.id ?? undefined,
      type: section.type,
      content: section.content ?? null,
      title: section.title ?? null,
      settings: {
        includeInPdf:
          section.settings?.includeInPdf ?? DaySections.isIncludeInPdfByDefault(section.type),
        expanded: section.settings?.expanded ?? DaySections.isExpandedByDefault(section.type),
      },
    });

    return formGroup;
  }

  private getNewDayFormGroup(): FormGroup<IBulletinDayForm> {
    return new FormGroup<IBulletinDayForm>({
      id: new FormControl<string | undefined>(undefined, {
        nonNullable: true,
      }),
      date: new FormControl<Date | null>(null, {
        nonNullable: true,
      }),
      title: new FormControl<string | null>(null, {
        validators: [Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH)],
      }),
      settings: new FormGroup<IBulletinDaySettingsForm>({
        showTitleInPdf: new FormControl<boolean>(false, { nonNullable: true }),
      }),
      sections: new FormArray<FormGroup<IBulletinDaySectionForm>>([]),
    } satisfies IBulletinDayForm);
  }

  private getNewSectionFormGroup(): FormGroup<IBulletinDaySectionForm> {
    const formGroup = new FormGroup<IBulletinDaySectionForm>({
      id: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      type: new FormControl<SectionType | null>(null, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      title: new FormControl<string | null>(null, {}),
      content: new FormControl<string | null>(null, {}),
      settings: new FormGroup<IBulletinSectionSettingsForm>({
        includeInPdf: new FormControl<boolean>(true, { nonNullable: true }),
        expanded: new FormControl<boolean>(true, { nonNullable: true }),
      }),
    });

    formGroup.controls.content.setValidators([
      conditionalValidator(
        () => !DaySections.isContentReadOnly(formGroup.controls.type.value),
        Validators.required
      ),
      Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH),
    ]);

    formGroup.controls.title.setValidators([
      conditionalValidator(
        () => !DaySections.isTitleReadOnly(formGroup.controls.type.value),
        Validators.required
      ),
      Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH),
    ]);

    formGroup.controls.type.valueChanges.subscribe((newSectionType: SectionType | null) => {
      if (DaySections.isTitleReadOnly(newSectionType)) {
        formGroup.controls.title.setValue(null);
      }

      if (DaySections.isContentReadOnly(newSectionType)) {
        formGroup.controls.content.setValue(null);
      }

      const isIncludeInPdfByDefault = DaySections.isIncludeInPdfByDefault(newSectionType);
      formGroup.controls.settings.controls.includeInPdf.setValue(isIncludeInPdfByDefault);
      if (!isIncludeInPdfByDefault) {
        formGroup.controls.settings.controls.includeInPdf.disable({ emitEvent: false });
      }

      formGroup.controls.settings.controls.expanded.setValue(
        DaySections.isExpandedByDefault(newSectionType)
      );
      formGroup.controls.content.updateValueAndValidity();
    });

    return formGroup;
  }

  private create(): FormGroup<IBulletinForm> {
    return this._formBuilder.group<IBulletinForm>({
      properties: new FormGroup<IBulletinPropertiesForm>({
        date: new FormControl<Date | null>(null, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        number: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_NUMBER_MAX_LENGTH),
          ],
        }),
        title: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH),
          ],
        }),
        introduction: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)],
        }),
        tipsForWork: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)],
        }),
        dailyPrayer: new FormControl<string | null>(null, {
          nonNullable: true,
          validators: [Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_INTRODUCTION_MAX_LENGTH)],
        }),
      }),
      days: new FormArray<FormGroup<IBulletinDayForm>>([]),
    } satisfies IBulletinForm);
  }
}
