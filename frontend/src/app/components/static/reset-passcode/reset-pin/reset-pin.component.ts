import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ResetPasscodeService } from 'src/app/components/static/reset-passcode/services/reset-passcode.service';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { WithForm } from 'src/mixins/with-form.mixin';
import { PipesModule } from 'src/pipes/pipes.module';
import { GuidUtils } from 'src/utils/guid.utils';
import { ObjectUtils } from 'src/utils/object.utils';
import { ControlValidators } from 'src/validators/control.validators';
import { pinValidator } from 'src/validators/pin.validator';
import { ResetPasscodeDto } from '../models/reset-passcode.models';
import { IResetPinForm } from '../reset-pin.form';
import { InvalidResetPinTokenComponent } from './invalid-reset-pin-token/invalid-reset-pin-token.component';
import { ResetPinControlComponent } from './reset-pin-control/reset-pin-control.component';

@Component({
  selector: 'app-reset-pin',
  imports: [
    FormsModule,
    PipesModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ResetPinControlComponent,
    InvalidResetPinTokenComponent,
  ],
  templateUrl: './reset-pin.component.html',
  styleUrl: './reset-pin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPinComponent extends WithForm<IResetPinForm>() {
  public readonly isTokenValid = input.required<boolean>();
  public readonly userEmail = input.required<string | undefined>();
  public readonly userId = input.required<string | undefined>();
  public readonly token = input.required<string | undefined>();

  public constructor(
    formBuilder: FormBuilder,
    private _router: Router,
    private _snackBarService: SnackBarService,
    private _resetPasscodeService: ResetPasscodeService
  ) {
    const formGroup = formBuilder.group<IResetPinForm>(
      {
        pin: new FormControl(null, { validators: [Validators.required] }),
        confirmPin: new FormControl(null, {
          validators: [pinValidator()],
        }),
      } satisfies IResetPinForm,
      {
        validators: [
          ControlValidators.matchControlsValue(
            ObjectUtils.nameOf<IResetPinForm>(p => p.pin),
            ObjectUtils.nameOf<IResetPinForm>(p => p.confirmPin)
          ),
        ],
      }
    );

    super(formGroup);
  }

  protected save(): void {
    if (!this.isReadyToSubmit() || !GuidUtils.isValidGuid(this.userId())) {
      this.showErrors();
      return;
    }

    this._resetPasscodeService
      .resetPasscode(this.userId()!, new ResetPasscodeDto(this.token()!, this.controls.pin.value))
      .subscribe(response => {
        if (response.isPasscodeSet) {
          this._snackBarService.translateAndShowSuccess({
            message: 'ResetPin/ResetPinSuccess',
            options: {
              duration: SnackBarService.LONG_SUCCESS_DURATION,
            },
          });
        } else {
          this._snackBarService.translateAndShowError({
            message: 'ResetPin/ResetPinFailed',
          });
        }

        this._router.navigateByUrl('/');
      });
  }
}
