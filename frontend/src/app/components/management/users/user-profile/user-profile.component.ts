import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { PATHS } from 'src/app/app.routes';
import { NewsMenu } from 'src/app/components/news/news.menu';
import { CardHeaderComponent } from 'src/app/components/static/card-header/card-header.component';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithForm } from 'src/mixins/with-form.mixin';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { UserProfileService } from '../services/user-profile.service';
import { IUserProfile } from './interfaces/user-profile.interfaces';
import { UpdateUserProfileDto } from './models/update-user-profile.model';
import { IUserProfileForm } from './user-profile.form';

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormsModule,
    PipesModule,
    DirectivesModule,
    CardHeaderComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent
  extends WithUnsubscribe(WithForm<IUserProfileForm>())
  implements OnInit
{
  protected readonly isLoaded = signal<boolean>(false);
  protected readonly maxLengths = VALIDATOR_SETTINGS;
  private readonly _userId: string | undefined = undefined;

  public constructor(
    authService: AuthService,
    formBuilder: FormBuilder,
    authTokenService: AuthTokenService,
    private _userProfileService: UserProfileService,
    private _router: Router,
    private _snackBarService: SnackBarService
  ) {
    const formGroup = formBuilder.group<IUserProfileForm>({
      email: new FormControl<string | null>(
        { value: null, disabled: true },
        {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.email,
            Validators.maxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH),
          ],
        }
      ),
      phone: new FormControl<string | null>(
        { value: null, disabled: true },
        {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.maxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH),
          ],
        }
      ),
      firstName: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH)],
      }),
      lastName: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [Validators.maxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH)],
      }),
      joiningDate: new FormControl<Date | null>(null, {
        nonNullable: true,
      }),
    } satisfies IUserProfileForm);

    super(formGroup);

    this._userId = authTokenService.getUserId();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.navigateToHomePage();
      })
    );
  }

  public ngOnInit(): void {
    if (!GuidUtils.isValidGuid(this._userId)) {
      this.goToNoPermissionPage();
      return;
    }

    this.addSubscription(
      this._userProfileService.get().subscribe((user: IUserProfile) => {
        if (user) {
          this.setForm(user);
          this.isLoaded.set(true);
        } else {
          this.goToNoPermissionPage();
        }
      })
    );
  }

  protected save(): void {
    if (!this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    const dto = new UpdateUserProfileDto(this.controls);
    this._userProfileService.update(dto).subscribe((response: boolean) => {
      if (response) {
        this._snackBarService.translateAndShowSuccess({
          message: 'Management/UserProfileForm/UpdatedSuccessfully',
          options: { duration: SnackBarService.LONG_SUCCESS_DURATION },
        });
      } else {
        this._snackBarService.translateAndShowError({
          message: 'Management/UserProfileForm/UpdateFailed',
        });
      }
    });
  }

  private setForm(user: IUserProfile): void {
    this.formGroup.patchValue({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      joiningDate: user.joiningDate,
    } satisfies IUserProfile);
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }

  private goToNoPermissionPage(): void {
    this._router.navigate(['/' + PATHS.NoPermission]);
    this._snackBarService.translateAndShowError({
      message: 'Errors/Invalid_User_Profile_Identifier',
    });
  }
}
