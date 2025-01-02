import { CommonModule } from '@angular/common';
import { Component, effect, Inject, model, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { IS_MOBILE } from 'src/app/app.config';
import { FormMode } from 'src/core/form-mode.enum';
import { DirectivesModule } from 'src/directives/directives.module';
import { IUser } from 'src/interfaces/users/user.interfaces';
import { WithForm } from 'src/mixins/with-form.mixin';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { AddUserDto } from './models/add-user.model';
import { EditUserDto } from './models/edit-user.model';
import { UserDto } from './models/user.model';
import { UserService } from './services/user.service';
import { IUserForm } from './user.form';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PipesModule, DirectivesModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent extends WithUnsubscribe(WithForm<IUserForm>()) implements OnInit {
  public user = model<AddUserDto | EditUserDto>();
  public formMode = signal<FormMode>(FormMode.Add);

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
      }),
      phone: new FormControl<string | null>(null, {
        nonNullable: true,
      }),
      firstName: new FormControl<string | null>(null, {
        nonNullable: true,
      }),
      lastName: new FormControl<string | null>(null, {
        nonNullable: true,
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
    });

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        //this.navigateToAnnouncementsList();
      })
    );
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (Guid.isGuid(id)) {
      this.addSubscription(
        this._userService.get(id).subscribe((user: IUser) => {
          if (user && Guid.isGuid(user.id)) {
            this.formMode.set(FormMode.Edit);
            this.user.set(EditUserDto.create(user));
          } else {
            this.user.set(AddUserDto.create());
          }
        })
      );
    } else {
      this.user.set(AddUserDto.create());
    }
  }

  public save(): void {
    console.log(this.user);
  }

  public cancel(): void {}
}