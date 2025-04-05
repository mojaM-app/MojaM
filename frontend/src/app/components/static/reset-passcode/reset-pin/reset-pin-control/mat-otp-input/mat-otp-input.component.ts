/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/member-ordering */
import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_FORM_FIELD, MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { REGEX_PATTERNS } from 'src/core/consts';

export class Pin {
  public constructor(
    public p1: string,
    public p2: string,
    public p3: string,
    public p4: string
  ) {}

  public toString(): string {
    return `${this.p1}${this.p2}${this.p3}${this.p4}`;
  }

  public static empty(): Pin {
    return new Pin('', '', '', '');
  }

  public static fromString(value: string | null | undefined): Pin {
    return new Pin(
      value?.charAt(0) ?? '',
      value?.charAt(1) ?? '',
      value?.charAt(2) ?? '',
      value?.charAt(3) ?? ''
    );
  }
}

@Component({
  selector: 'app-mat-opt-input-component',
  templateUrl: './mat-otp-input.component.html',
  styleUrl: './mat-otp-input.component.scss',
  providers: [{ provide: MatFormFieldControl, useExisting: MatOtpInputComponent }],
  host: {
    '[class.floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatOtpInputComponent
  implements ControlValueAccessor, MatFormFieldControl<string>, OnDestroy
{
  public ngControl = inject(NgControl, { optional: true, self: true });
  public readonly stateChanges = new Subject<void>();
  public readonly touched = signal(false);
  public readonly controlType: string = 'otp-input';
  public readonly id = `otp-input-${MatOtpInputComponent._nextId++}`;
  public readonly _userAriaDescribedBy = input<string>('', { alias: 'aria-describedby' });
  public readonly _placeholder = input<string>('', { alias: 'placeholder' });
  public readonly _required = input<boolean, unknown>(false, {
    alias: 'required',
    transform: booleanAttribute,
  });
  public readonly _disabledByInput = input<boolean, unknown>(false, {
    alias: 'disabled',
    transform: booleanAttribute,
  });
  public readonly _value = model<string | null>(null, { alias: 'value' });
  public readonly hidePin = input<boolean>(true);

  private static _nextId = 0;
  private readonly _p1 = viewChild.required<ElementRef<HTMLInputElement>>('p1');
  private readonly _p2 = viewChild.required<ElementRef<HTMLInputElement>>('p2');
  private readonly _p3 = viewChild.required<ElementRef<HTMLInputElement>>('p3');
  private readonly _p4 = viewChild.required<ElementRef<HTMLInputElement>>('p4');
  private readonly _focused = signal(false);
  private readonly _disabledByCva = signal(false);
  private readonly _disabled = computed(() => this._disabledByInput() || this._disabledByCva());
  private readonly _focusMonitor = inject(FocusMonitor);
  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly parts: FormGroup<{
    p1: FormControl<string | null>;
    p2: FormControl<string | null>;
    p3: FormControl<string | null>;
    p4: FormControl<string | null>;
  }>;

  protected readonly _formField = inject(MAT_FORM_FIELD, {
    optional: true,
  });
  protected readonly pattern = REGEX_PATTERNS.ALPHANUMERIC_ONE_CHAR;

  public get focused(): boolean {
    return this._focused();
  }

  public get empty(): boolean {
    const {
      value: { p1, p2, p3, p4 },
    } = this.parts;

    return !p1 && !p2 && !p3 && !p4;
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

  public get disabled(): boolean {
    return this._disabled();
  }

  public get value(): string | null {
    return this._value();
  }

  public get errorState(): boolean {
    return this.parts.invalid && this.touched();
  }

  public constructor() {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.parts = inject(FormBuilder).group({
      p1: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1),
          Validators.pattern(this.pattern),
        ],
      ],
      p2: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1),
          Validators.pattern(this.pattern),
        ],
      ],
      p3: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1),
          Validators.pattern(this.pattern),
        ],
      ],
      p4: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1),
          Validators.pattern(this.pattern),
        ],
      ],
    });

    effect(() => {
      // Read signals to trigger effect.
      this._placeholder();
      this._required();
      this._disabled();
      this._focused();
      // Propagate state changes.
      untracked(() => this.stateChanges.next());
    });

    effect(() => {
      if (this._disabled()) {
        untracked(() => this.parts.disable());
      } else {
        untracked(() => this.parts.enable());
      }
    });

    effect(() => {
      const value = this._value() || Pin.empty().toString();
      untracked(() => this.parts.setValue(Pin.fromString(value)));
    });

    this.parts.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.stateChanges.next();
    });

    this.parts.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      const pin = new Pin(value.p1 || '', value.p2 || '', value.p3 || '', value.p4 || '');
      this.updateValue(pin);
    });
  }

  public ngOnDestroy(): void {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  public setDescribedByIds(ids: string[]): void {
    const controlElement = this._elementRef.nativeElement.querySelector('.otp-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  public onContainerClick(event: MouseEvent): void {
    if ((event.target as Element).tagName.toLowerCase() === 'input') {
      this._focusMonitor.focusVia(event.target as HTMLInputElement, 'program');
      (event.target as HTMLInputElement).select();
    } else {
      if (!this.parts.controls.p1.valid) {
        this._focusMonitor.focusVia(this._p1(), 'program');
        this._p1().nativeElement.select();
      } else if (!this.parts.controls.p2.valid) {
        this._focusMonitor.focusVia(this._p2(), 'program');
        this._p2().nativeElement.select();
      } else if (!this.parts.controls.p3.valid) {
        this._focusMonitor.focusVia(this._p3(), 'program');
        this._p3().nativeElement.select();
      } else {
        this._focusMonitor.focusVia(this._p4(), 'program');
        this._p4().nativeElement.select();
      }
    }
  }

  public writeValue(pin: string | null): void {
    this.updateValue(Pin.fromString(pin));
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

  public focusFirstInput(): void {
    this._focusMonitor.focusVia(this._p1(), 'program');
    this._p1().nativeElement.select();
  }

  protected autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (!control.errors && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
      nextElement.select();
    }
  }

  protected autoFocusPrev(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length < 1) {
      this._focusMonitor.focusVia(prevElement, 'program');
      prevElement.select();
    }
  }

  protected handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (nextElement) {
      this.autoFocusNext(control, nextElement);
    } else {
      this._p4().nativeElement.select();
    }
    this.onChange(this.value);
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

  private updateValue(pin: Pin | null): void {
    const current = Pin.fromString(this._value());
    if (
      pin === current ||
      (pin?.p1 === current?.p1 &&
        pin?.p2 === current?.p2 &&
        pin?.p3 === current?.p3 &&
        pin?.p4 === current?.p4)
    ) {
      return;
    }

    this._value.set(pin?.toString() ?? null);
  }

  private onChange = (_: any): void => {};
  private onTouched = (): void => {};
}
