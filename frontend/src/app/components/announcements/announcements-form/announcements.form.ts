import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AnnouncementsDto } from '../models/announcements.model';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { Injectable } from '@angular/core';

export interface IAnnouncementsItemForm {
  id: FormControl<string | undefined>;
  content: FormControl<string | null>;
}

export interface IAnnouncementsForm {
  validFromDate: FormControl<Date | null>;
  items: FormArray<FormGroup<IAnnouncementsItemForm>>;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsFormBuilder {
  private readonly _form: FormGroup<IAnnouncementsForm>;
  public get form(): FormGroup<IAnnouncementsForm> {
    return this._form;
  }

  public constructor(private _formBuilder: FormBuilder) {
    this._form = this.create();
  }

  public addNewItem(id?: string, content?: string | null): void {
    this._form.controls.items.push(
      new FormGroup<IAnnouncementsItemForm>({
        id: new FormControl<string | undefined>(id, {
          nonNullable: true,
        }),
        content: new FormControl<string | null>(content ?? null, {
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH),
          ],
        }),
      } satisfies IAnnouncementsItemForm)
    );
  }

  public setFormValues(model: AnnouncementsDto | undefined | null): void {
    if (!model) {
      return;
    }

    this._form.patchValue({
      validFromDate: model.validFromDate ?? null,
      items: [],
    } satisfies AnnouncementsDto);

    this._form.controls.items.clear();

    (model.items ?? []).forEach(item => {
      this.addNewItem(item.id, item.content);
    });
  }

  public isValid(): boolean {
    //TODO: Implement validation logic if needed

    return true;
  }

  private create(): FormGroup<IAnnouncementsForm> {
    return this._formBuilder.group<IAnnouncementsForm>({
      validFromDate: new FormControl<Date | null>(null, {
        nonNullable: true,
      }),
      items: new FormArray<FormGroup<IAnnouncementsItemForm>>([]),
    } satisfies IAnnouncementsForm);
  }
}
