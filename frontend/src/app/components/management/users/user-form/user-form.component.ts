import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  model,
  OnInit,
  signal,
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { NewsMenu } from 'src/app/components/news/news.menu';
import { CardHeaderComponent } from 'src/app/components/static/card-header/card-header.component';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { VALIDATOR_SETTINGS } from 'src/core/consts';
import { FormMode } from 'src/core/form-mode.enum';
import { DirectivesModule } from 'src/directives/directives.module';
import { environment } from 'src/environments/environment';
import { IUser } from 'src/core/interfaces/users/user.interfaces';
import { WithForm } from 'src/mixins/with-form.mixin';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { ManagementMenuUserList } from '../../management.menu';
import { UserService } from '../services/user.service';
import { AddUserDto } from './models/add-user.model';
import { EditUserDto } from './models/edit-user.model';
import { UserDto } from './models/user.model';
import { IUserForm } from './user.form';

@Component({
  selector: 'app-user-form',
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
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent extends WithUnsubscribe(WithForm<IUserForm>()) implements OnInit {
  protected readonly formModeTypes = FormMode;
  protected readonly maxLengths = VALIDATOR_SETTINGS;
  protected readonly user = model<IUser>();
  protected readonly formMode = signal<FormMode>(FormMode.Add);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    authService: AuthService,
    formBuilder: FormBuilder,
    private _router: Router,
    private _route: ActivatedRoute,
    private _snackBarService: SnackBarService,
    private _userService: UserService
  ) {
    const formGroup = formBuilder.group<IUserForm>({
      email: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH),
        ],
      }),
      phone: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH),
        ],
      }),
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
    } satisfies IUserForm);

    super(formGroup);

    effect(() => {
      const model = this.user();
      if (model) {
        formGroup.patchValue({
          email: model.email,
          phone: model.phone,
          firstName: model.firstName,
          lastName: model.lastName,
          joiningDate: model.joiningDate,
        } satisfies UserDto);
      }

      if (this.formMode() === FormMode.Add && environment.production === false) {
        this.formGroup.patchValue({
          email: `email${new Date().getTime()}@example.com`,
          phone: '123456789',
          firstName: 'John',
          lastName: 'Doe',
          joiningDate: new Date(),
        });
      }
    });

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToHomePage();
      });
    });
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (GuidUtils.isValidGuid(id)) {
      this.addSubscription(
        this._userService.get(id).subscribe((user: IUser) => {
          if (user && GuidUtils.isValidGuid(user.id)) {
            this.formMode.set(FormMode.Edit);
            this.user.set(user);
          } else {
            this.user.set(UserDto.empty());
          }
        })
      );
    } else {
      this.user.set(UserDto.empty());
    }
  }

  protected save(): void {
    if (!this.isReadyToSubmit()) {
      this.showErrors();
      return;
    }

    if (this.formMode() === FormMode.Edit) {
      const dto = new EditUserDto(this.user()!.id!, this.controls);
      this._userService.update(dto).subscribe(() => {
        this._snackBarService.translateAndShowSuccess({
          message: 'Management/UserForm/UserSavedSuccessfully',
          options: {
            duration: SnackBarService.SUCCESS_DURATION,
          },
        });

        this.navigateToUserList();
      });
    } else {
      const dto = new AddUserDto(this.controls);
      this._userService.create(dto).subscribe(() => {
        this._snackBarService.translateAndShowSuccess({
          message: 'Management/UserForm/UserAddedSuccessfully',
          options: {
            duration: SnackBarService.SUCCESS_DURATION,
          },
        });

        this.navigateToUserList();
      });
    }
  }

  protected cancel(): void {
    this.navigateToUserList();
  }

  private navigateToHomePage(): void {
    this._router.navigateByUrl(NewsMenu.Path);
  }

  private navigateToUserList(): void {
    this._router.navigateByUrl(ManagementMenuUserList.Path);
  }
}
