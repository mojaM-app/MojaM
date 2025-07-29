import {
  CreateEffectOptions,
  Directive,
  effect,
  input,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatDialogConfig } from '@angular/material/dialog';
import { IDialogSettings } from 'src/interfaces/common/dialog.settings';
import { DialogService } from 'src/services/dialog/dialog.service';
import { IAnnouncementsItemForm } from '../announcements.form';

@Directive()
export abstract class AnnouncementItemBase {
  public readonly itemFormGroup = input.required<AbstractControl>();
  public readonly controls = signal<IAnnouncementsItemForm | undefined>(undefined);
  public readonly index = input.required<number>();
  public content: WritableSignal<string> = signal('');

  public deleteItem = output<number>();
  public moveItem = output<{ index: number; direction: 'up' | 'down' }>();

  protected constructor(protected _dialogService: DialogService) {
    effect(
      () => {
        const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
        if ((formGroup?.value?.content?.length ?? 0) > 0) {
          this.content.set(formGroup.value.content!);
        }
        this.controls.set(formGroup.controls);
      },
      {
        allowSignalWrites: true,
      } satisfies CreateEffectOptions
    );
  }

  public editItem(): void {
    const dialogRef = this._dialogService.openWysiwygEditor(
      this.content() ?? '',
      this.getDialogConfig()
    );

    dialogRef.afterClosed().subscribe((result: string | undefined) => {
      if (result !== undefined) {
        this.setNewContent(result ?? '');
      }
      this.afterCloseDialog();
    });
  }

  public confirmDeleteItem(): void {
    this._dialogService
      .confirm({
        message: { text: 'Announcements/Form/DeleteConfirmText' },
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnDelete',
      } satisfies IDialogSettings)
      .then((result: boolean) => {
        if (result === true) {
          this.deleteItem.emit(this.index());
        }
      });
  }

  public moveItemUp(): void {
    this.moveItem.emit({ index: this.index(), direction: 'up' });
  }

  public moveItemDown(): void {
    this.moveItem.emit({ index: this.index(), direction: 'down' });
  }

  protected setNewContent(content: string): void {
    const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
    formGroup.patchValue({
      content: content,
    });
    this.content.set(content);
  }

  protected abstract afterCloseDialog(): void;

  protected abstract getDialogConfig(): MatDialogConfig;
}
