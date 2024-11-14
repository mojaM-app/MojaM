import {
  CreateEffectOptions,
  Directive,
  effect,
  input,
  signal,
  WritableSignal,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { IAnnouncementsItemForm } from '../announcements.form';

@Directive()
export abstract class AnnouncementItemBase {
  public readonly itemFormGroup = input.required<AbstractControl>();
  public readonly controls = signal<IAnnouncementsItemForm | undefined>(undefined);
  public readonly index = input.required<number>();
  public content: WritableSignal<string> = signal('');

  protected constructor() {
    effect(
      () => {
        const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
        if ((formGroup?.value?.content?.length ?? 0) > 0) {
          this.content.set(formGroup.value.content ?? '');
        }
        this.controls.set(formGroup.controls);
      },
      {
        allowSignalWrites: true,
      } satisfies CreateEffectOptions
    );
  }

  public abstract editItem(): void;
  public abstract deleteItem(): void;

  protected setNewContent(content: string): void {
    const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
    formGroup.patchValue({
      content: content,
    });
    this.content.set(content);
  }
}
