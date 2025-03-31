import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IS_MOBILE } from 'src/app/app.config';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { UserDetailsService } from '../../services/user-details.service';
import { IUserDetails } from '../interfaces/user-details.interfaces';

@Component({
  selector: 'app-user-details',
  imports: [
    PipesModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsComponent extends WithUnsubscribe() {
  public userId = input.required<string | null>();
  public isExpanded = model(false);
  public userDetails = signal<IUserDetails | null>(null);

  public constructor(
    @Inject(IS_MOBILE) protected isMobile: boolean,
    userDetailsService: UserDetailsService,
    private _clipboard: Clipboard,
    private _snackBarService: SnackBarService
  ) {
    super();

    effect(() => {
      if (!this.userId() || !this.isExpanded()) {
        return;
      }

      if (!this.userDetails()) {
        this.addSubscription(
          userDetailsService.get(this.userId()!).subscribe(userDetails => {
            this.userDetails.set(userDetails);
          })
        );
      }
    });
  }

  protected copyToClipboard(value: string): void {
    if (this._clipboard.copy(value)) {
      this._snackBarService.translateAndShowSuccess({
        message: 'Shared/CopiedToClipboard',
        options: {
          duration: SnackBarService.SHORT_SUCCESS_DURATION,
        },
      });
    }
  }

  protected sendEmail(): void {
    window.open(`mailto:${this.userDetails()?.email}`, '_blank');
  }

  protected sendSms(): void {
    window.open(`sms:${this.userDetails()?.phone}`, '_blank');
  }
}
