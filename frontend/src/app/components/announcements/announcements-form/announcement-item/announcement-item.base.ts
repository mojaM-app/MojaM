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

  public abstract editItem(): void;

  public confirmDeleteItem(): void {
    this._dialogService
      .confirm({
        text: 'Announcements/Form/DeleteConfirmText',
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnDelete',
      } satisfies IDialogSettings)
      .then(result => {
        if (result === true) {
          this.deleteItem.emit(this.index());
        }
      });
  }

  protected setNewContent(content: string): void {
    const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
    formGroup.patchValue({
      content: content,
    });
    this.content.set(content);
  }
}
