import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, Inject, input } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IS_MOBILE } from 'src/app/app.config';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { AnnouncementsDto } from '../models/announcements.model';
import { AnnouncementItemDesktopComponent } from './announcement-item/announcement-item-desktop/announcement-item-desktop.component';
import { AnnouncementItemMobileComponent } from './announcement-item/announcement-item-mobile/announcement-item-mobile.component';
import {
  AnnouncementItemFormControlNames,
  AnnouncementsFormControlNames,
  IAnnouncementsForm,
  IAnnouncementsItemForm,
} from './announcements.form';

@Component({
  selector: 'app-announcements-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    AnnouncementItemMobileComponent,
    AnnouncementItemDesktopComponent,
    PipesModule,
    DirectivesModule,
    FormsModule,
  ],
  templateUrl: './announcements-form.component.html',
  styleUrl: './announcements-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsFormComponent extends WithForm<IAnnouncementsForm>() {
  public readonly formControlNames = AnnouncementsFormControlNames;
  public readonly itemsFormControlNames = AnnouncementItemFormControlNames;

  public readonly announcements = input.required<AnnouncementsDto>();

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    formBuilder: FormBuilder,
    private _snackBarService: SnackBarService
  ) {
    const formGroup = formBuilder.group<IAnnouncementsForm>({
      validFromDate: new FormControl<Date | null>(null, {
        nonNullable: true,
      }),
      items: new FormArray<FormGroup<IAnnouncementsItemForm>>([]),
    } satisfies IAnnouncementsForm);

    super(formGroup);

    effect(() => {
      const model = this.announcements();
      if (model) {
        formGroup.patchValue({
          validFromDate: model.validFromDate ?? null,
        } satisfies AnnouncementsDto);

        (model.items ?? []).forEach(item => {
          this.addItem(item.id, item.content);
        });
      }
    });
  }

  public addItem(id?: string, content?: string): void {
    this.array(this.formControlNames.items).push(
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

  public removeItem(index: number): void {
    const items = this.array(this.formControlNames.items);
    items.removeAt(index);
  }

  public moveItem({ index, direction }: { index: number; direction: 'up' | 'down' }): void {
    const items = this.array(this.formControlNames.items);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) {
      return;
    }
    const item = items.at(index);
    items.removeAt(index);
    items.insert(newIndex, item);
  }

  public containsValidData(): boolean {
    const items = this.array(this.formControlNames.items);

    if ((items?.length ?? 0) === 0) {
      this._snackBarService.translateAndShowError(
        'Announcements/Form/Errors/AtLeastOneItemIsRequired'
      );
      return false;
    }

    for (const formGroup of items.controls) {
      const controls = (formGroup as FormGroup<IAnnouncementsItemForm>).controls;

      if (controls.content.errors) {
        const isRequired = controls.content.errors[this.errorNames.required];
        if (isRequired) {
          this._snackBarService.translateAndShowError(
            'Announcements/Form/Errors/ContentIsRequired'
          );
          return false;
        }

        const tooLength = controls.content.errors[this.errorNames.maxLength];
        if (tooLength) {
          this._snackBarService.translateAndShowError(
            'Announcements/Form/Errors/ContentIsTooLong',
            { maxLength: VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH }
          );
          return false;
        }
      }
    }

    return this.isReadyToSubmit();
  }
}
