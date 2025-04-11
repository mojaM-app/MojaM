import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResetPasscodeService } from 'src/app/components/static/reset-passcode/services/reset-passcode.service';
import { AuthenticationTypes } from '../activate-account/enums/authentication-type.enum';
import { ICheckResetPasscodeTokenResultDto } from './interfaces/reset-passcode.interfaces';
import { InvalidResetPasswordTokenComponent } from './reset-password/invalid-reset-password-token/invalid-reset-password-token.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { InvalidResetPinTokenComponent } from './reset-pin/invalid-reset-pin-token/invalid-reset-pin-token.component';
import { ResetPinComponent } from './reset-pin/reset-pin.component';

@Component({
  selector: 'app-reset-passcode',
  imports: [
    ResetPasswordComponent,
    ResetPinComponent,
    InvalidResetPasswordTokenComponent,
    InvalidResetPinTokenComponent,
  ],
  templateUrl: './reset-passcode.component.html',
  styleUrl: './reset-passcode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasscodeComponent implements OnInit {
  protected readonly isTokenValid = signal<boolean | null>(null);
  protected readonly userEmail = signal<string | undefined>(undefined);
  protected readonly authenticationType = signal<AuthenticationTypes | undefined>(undefined);
  protected readonly userId = signal<string | undefined>(undefined);
  protected readonly token = signal<string | undefined>(undefined);
  protected readonly AuthenticationTypes = AuthenticationTypes;

  public constructor(
    private _route: ActivatedRoute,
    private _resetPasswordService: ResetPasscodeService
  ) {}

  public ngOnInit(): void {
    const params = this._route.snapshot.params;
    const userId = params['userId'];
    const token = params['token'];

    this._resetPasswordService
      .checkResetPasscodeToken(userId, token)
      .subscribe((result: ICheckResetPasscodeTokenResultDto) => {
        this.userEmail.set(result.userEmail);
        this.authenticationType.set(result.authType);
        this.userId.set(userId);
        this.token.set(token);
        this.isTokenValid.set(result.isValid);
      });
  }
}
