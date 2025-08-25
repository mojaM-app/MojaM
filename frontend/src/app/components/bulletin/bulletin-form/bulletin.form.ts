import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { BulletinDaySectionDto, BulletinDto } from '../models/bulletin.model';
import { SectionType } from '../enums/section-type.enum';
import { conditionalValidator } from 'src/validators/conditional.validator';

export interface IBulletinDaySectionForm {
  id: FormControl<string | undefined>;
  type: FormControl<SectionType | null>;
  title: FormControl<string | null>;
  content: FormControl<string | null>;
}

export interface IBulletinDayForm {
  id: FormControl<string | undefined>;
  date: FormControl<Date | null>;
  title: FormControl<string | null>;
  sections: FormArray<FormGroup<IBulletinDaySectionForm>>;
}

export interface IBulletinPropertiesForm {
  date: FormControl<Date | null>;
  number: FormControl<number | null>;
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

  public addNewDay(): void {
    const newDay = this.getNewDayFormGroup();
    const lastDay = this.days.length > 0 ? this.days.at(this.days.length - 1) : null;
    if (lastDay && lastDay.controls.date.value) {
      const lastDate = new Date(lastDay.controls.date.value);
      lastDate.setDate(lastDate.getDate() + 1);
      newDay.controls.date.setValue(lastDate);
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
    });

    this._form.controls.days.clear();

    (model.days ?? []).forEach(day => {
      const dayGroup = this.getNewDayFormGroup();

      dayGroup.patchValue({
        id: day.id,
        date: day.date ?? null,
        title: day.title ?? null,
      });

      const sectionsArray = dayGroup.controls.sections;

      (day.sections ?? []).forEach(section => {
        const sectionGroup = this.getNewSectionFormGroup();
        sectionGroup.patchValue({
          id: section.id,
          title: section.title ?? null,
          type: section.type ?? SectionType.CUSTOM_TEXT,
          content: section.content ?? null,
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
      title: new FormControl<string | null>(null, {
        validators: [Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_TITLE_MAX_LENGTH)],
      }),
      content: new FormControl<string | null>(null, {}),
    });

    formGroup.controls.content.setValidators([
      conditionalValidator(
        () => formGroup.controls.type.value === SectionType.CUSTOM_TEXT,
        Validators.required
      ),
      Validators.maxLength(VALIDATOR_SETTINGS.BULLETIN_DAY_SECTION_CONTENT_MAX_LENGTH),
    ]);

    formGroup.controls.type.valueChanges.subscribe(() => {
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
        number: new FormControl<number | null>(null, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.min(1),
            Validators.max(Number.MAX_SAFE_INTEGER),
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
