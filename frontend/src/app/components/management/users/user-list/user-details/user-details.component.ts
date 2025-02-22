import { ChangeDetectionStrategy, Component, effect, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { UserDetailsService } from '../../services/user-details.service';
import { IUserDetails } from '../interfaces/user-details.interfaces';

@Component({
  selector: 'app-user-details',
  imports: [PipesModule, MatInputModule, MatFormFieldModule, FormsModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsComponent extends WithUnsubscribe() {
  public userId = input.required<string | null>();
  public isExpanded = model(false);
  public userDetails = signal<IUserDetails | null>(null);

  public constructor(userDetailsService: UserDetailsService) {
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
}
