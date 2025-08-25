/* eslint-disable @angular-eslint/no-input-rename */
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  effect,
  untracked,
  input,
  model,
  output,
  computed,
  Inject,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormFieldControl } from '@angular/material/form-field';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ContentChange, QuillConfig, QuillModule } from 'ngx-quill';
import { PipesModule } from 'src/pipes/pipes.module';
import { WysiwygUtils } from '../wysiwyg.utils';
import { StringUtils } from 'src/utils/string.utils';
import Quill from 'quill';
import { TranslationService } from 'src/services/translate/translation.service';
import { QUILL_CONFIG_TOKEN } from 'ngx-quill';

@Component({
  selector: 'app-wysiwyg-form-field',
  templateUrl: './wysiwyg-form-field.component.html',
  styleUrls: ['./wysiwyg-form-field.component.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: WysiwygFormFieldComponent }],
  imports: [QuillModule, CommonModule, FormsModule, PipesModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygFormFieldComponent
  implements ControlValueAccessor, MatFormFieldControl<string>, OnDestroy
{
  public ngControl = inject(NgControl, { optional: true, self: true });
  public readonly stateChanges = new Subject<void>();
  public readonly touched = signal(false);
  public readonly controlType: string = 'wysiwyg-editor';
  public readonly id = `wysiwyg-editor-${WysiwygFormFieldComponent._nextId++}`;
  public readonly _userAriaDescribedBy = input<string>('', { alias: 'aria-describedby' });
  public readonly _placeholder = input<string>('', { alias: 'placeholder' });
  public readonly _required = input<boolean, unknown>(false, {
    alias: 'required',
    transform: Boolean,
  });
  public readonly _disabledByInput = input<boolean, unknown>(false, {
    alias: 'disabled',
    transform: Boolean,
  });
  public readonly _value = model<string | null>(null, { alias: 'value' });
  public readonly _maxLength = input<number | null>(null, { alias: 'maxLength' });
  public readonly _readonly = model<boolean>(false, { alias: 'readonly' });
  public readonly showHelpBtn = input.required<boolean>();
  public readonly helpClicked = output<void>();

  protected _valueRaw: string | null = null;
  protected readonly _formField = inject(MAT_FORM_FIELD, {
    optional: true,
  });
  protected quillModules = computed(() => {
    const toolbar: any[] = [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ];

    if (this.showHelpBtn()) {
      toolbar.push(['help']);
    }

    return {
      ...this._globalConfig.modules,
      toolbar: {
        container: toolbar,
        handlers: {
          help: (): void => this.onHelpBtnClicked(),
        },
      },
    };
  });

  private static _nextId = 0;

  private readonly _focused = signal(false);
  private readonly _disabledByCva = signal(false);
  private readonly _disabled = signal(false);

  private readonly _focusMonitor = inject(FocusMonitor);
  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public get focused(): boolean {
    return this._focused();
  }

  public get empty(): boolean {
    const val = this._value();
    return !val || StringUtils.isEmpty(WysiwygUtils.clearContent(val));
  }

  public get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  public get userAriaDescribedBy(): string {
    return this._userAriaDescribedBy();
  }

  public get placeholder(): string {
    return this._placeholder();
  }

  public get required(): boolean {
    return this._required();
  }

  public get readonly(): boolean {
    return this._readonly();
  }

  public get disabled(): boolean {
    return this._disabled();
  }

  public get maxLength(): number {
    return this._maxLength() ?? 0;
  }

  public get value(): string | null {
    return this._value();
  }

  public get errorState(): boolean {
    return !!(this.ngControl?.control?.invalid && this.touched());
  }

  public constructor(
    @Inject(QUILL_CONFIG_TOKEN) private _globalConfig: QuillConfig,
    private readonly _translationService: TranslationService
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      untracked(() => {
        this._disabled.set(this._disabledByInput() || this._disabledByCva());
        this.stateChanges.next();
      });
    });

    this._focusMonitor.monitor(this._elementRef.nativeElement, true).subscribe(origin => {
      this._focused.set(!!origin);
      this.stateChanges.next();
      if (!origin) {
        this.touched.set(true);
        this.onTouched();
      }
    });
  }

  public ngOnDestroy(): void {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef.nativeElement);
  }

  public setDescribedByIds(ids: string[]): void {
    const controlElement = this._elementRef.nativeElement.querySelector('.quill-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  public onContainerClick(event: MouseEvent): void {
    const quillEditor: HTMLElement | null =
      this._elementRef.nativeElement.querySelector('.ql-container');
    quillEditor?.focus();
  }

  public writeValue(value: string | null): void {
    this._valueRaw = value;
    this._value.set(WysiwygUtils.clearContent(value));
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this._disabledByCva.set(isDisabled);
  }

  protected onEditorCreated(quill: Quill): void {
    const toolbar = quill.getModule('toolbar');
    if (toolbar) {
      const button = this._elementRef.nativeElement.querySelector('.ql-help') as HTMLButtonElement;
      if (button) {
        button.style.backgroundColor = 'var(--mat-sys-surface-bright)';
        button.style.color = 'var(--mat-sys-on-surface)';
        button.style.width = 'auto';
        button.style.height = 'auto';
        button.style.padding = '0 10px';
        button.classList.add('mat-mdc-button', 'mat-mdc-unelevated-button', 'mat-mdc-button-base');
        button.innerHTML = `<span style="font-size: 90%;">
          ${this._translationService.get('Shared/BtnHelp')}
          </span>`;
      }
    }
  }

  protected onContentChanged(event: ContentChange): void {
    const html = WysiwygUtils.clearContent(event?.html);
    this._value.set(html);
    this.onChange(html);
    this.stateChanges.next();
  }

  protected onFocusIn(): void {
    if (!this._focused()) {
      this._focused.set(true);
      this.stateChanges.next();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.touched.set(true);
      this._focused.set(false);
      this.onTouched();
      this.stateChanges.next();
    }
  }

  protected onChange = (_: any): void => {};
  protected onTouched = (): void => {};

  private onHelpBtnClicked(): void {
    this.helpClicked.emit();
  }
}
