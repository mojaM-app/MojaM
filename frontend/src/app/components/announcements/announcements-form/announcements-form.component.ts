import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  Inject,
  input,
} from '@angular/core';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IS_MOBILE } from 'src/app/app.config';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsDto } from '../models/announcements.model';
import { AnnouncementItemDesktopComponent } from './announcement-item/announcement-item-desktop/announcement-item-desktop.component';
import { AnnouncementItemMobileComponent } from './announcement-item/announcement-item-mobile/announcement-item-mobile.component';
import {
  AnnouncementsFormBuilder,
  IAnnouncementsForm,
  IAnnouncementsItemForm,
} from './announcements.form';
import { AnnouncementsService } from '../services/announcements.service';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { IAnnouncementItem } from '../interfaces/announcements';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AnnouncementItemPickerDialogComponent } from './announcement-item-picker-dialog/announcement-item-picker-dialog.component';
import { MatDialogConfig } from '@angular/material/dialog';

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
  providers: [AnnouncementsFormBuilder],
  templateUrl: './announcements-form.component.html',
  styleUrl: './announcements-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsFormComponent extends WithUnsubscribe(WithForm<IAnnouncementsForm>()) {
  public readonly announcements = input.required<AnnouncementsDto>();

  public constructor(
    @Inject(IS_MOBILE) protected isMobile: boolean,
    private readonly _formBuilder: AnnouncementsFormBuilder,
    private readonly _snackBarService: SnackBarService,
    private readonly _announcementsService: AnnouncementsService,
    private readonly _dialogService: DialogService,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {
    super(_formBuilder.form);

    effect(() => {
      const model = this.announcements();
      this._formBuilder.setFormValues(model);
    });
  }

  public containsValidData(): boolean {
    const items = this.formGroup.controls.items;

    if ((items?.length ?? 0) === 0) {
      this._snackBarService.translateAndShowError({
        message: 'Announcements/Form/Errors/AtLeastOneItemIsRequired',
      });
      return false;
    }

    for (const formGroup of items.controls) {
      const controls = (formGroup as FormGroup<IAnnouncementsItemForm>).controls;

      if (controls.content.errors) {
        const isRequired = controls.content.errors[this.errorNames.required];
        if (isRequired) {
          this._snackBarService.translateAndShowError({
            message: 'Announcements/Form/Errors/ContentIsRequired',
          });
          return false;
        }

        const tooLength = controls.content.errors[this.errorNames.maxLength];
        if (tooLength) {
          this._snackBarService.translateAndShowError({
            message: 'Announcements/Form/Errors/ContentIsTooLong',
            interpolateParams: {
              maxLength: VALIDATOR_SETTINGS.ANNOUNCEMENT_ITEM_CONTENT_MAX_LENGTH,
            },
          });
          return false;
        }
      }
    }

    return this._formBuilder.isValid() && this.isReadyToSubmit();
  }

  protected addItem(): void {
    this._formBuilder.addNewItem();
  }

  protected addItemFromAnother(): void {
    const items = this.controls.items as any as FormArray<FormGroup<IAnnouncementsItemForm>>;
    const itemsToExclude = items.controls
      .map(formGroup => formGroup.controls.content.value)
      .filter(content => content)
      .map(content => {
        return {
          content: content!,
        } satisfies Partial<IAnnouncementItem>;
      });

    this._announcementsService
      .getTopAnnouncementItems(itemsToExclude)
      .subscribe((items: IAnnouncementItem[]) => {
        if (items.length === 0) {
          this._snackBarService.translateAndShowError({
            message: 'Announcements/Form/Errors/NoTopNItems',
          });
          return;
        }

        const dialogRef = this._dialogService.open(AnnouncementItemPickerDialogComponent, {
          data: {
            items: items,
          },
          autoFocus: false,
          restoreFocus: false,
          ...(this.isMobile ? this.mobileDialogSettings() : this.desktopDialogSettings()),
        });

        dialogRef.componentInstance.addItemHandler.subscribe(value => {
          this._formBuilder.addNewItem(undefined, value);
          this._changeDetectorRef.markForCheck();
        });
      });
  }

  protected removeItem(index: number): void {
    this.formGroup.controls.items.removeAt(index);
  }

  protected moveItem({ index, direction }: { index: number; direction: 'up' | 'down' }): void {
    const items = this.formGroup.controls.items;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) {
      return;
    }
    const item = items.at(index);
    items.removeAt(index);
    items.insert(newIndex, item);
  }

  private mobileDialogSettings(): MatDialogConfig {
    return {
      height: 'calc(100% - 10px)',
      width: 'calc(100% - 10px)',
      maxWidth: '100%',
      maxHeight: '100%',
      position: { top: '5px', left: '5px' },
    };
  }

  private desktopDialogSettings(): MatDialogConfig {
    return {
      maxHeight: '80%',
      width: '60%',
      maxWidth: '100%',
      position: { top: '5%', left: '20%' },
    };
  }
}
