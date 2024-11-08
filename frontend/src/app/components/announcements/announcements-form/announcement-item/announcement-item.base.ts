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
  public readonly index = input.required<number>();
  public content: WritableSignal<string> = signal('');

  protected constructor() {
    effect(
      () => {
        const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
        if ((formGroup?.value?.content?.length ?? 0) > 0) {
          this.content.set(formGroup.value.content ?? '');
        }
      },
      {
        allowSignalWrites: true,
      } satisfies CreateEffectOptions
    );
  }

  public abstract editItem(): void;

  protected setNewContent(content: string): void {
    const formGroup = this.itemFormGroup() as FormGroup<IAnnouncementsItemForm>;
    formGroup.patchValue({
      content: content,
    });
    this.content.set(content);
  }
}
