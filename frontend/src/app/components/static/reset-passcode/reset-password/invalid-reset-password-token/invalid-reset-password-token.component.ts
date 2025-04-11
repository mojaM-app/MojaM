import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-invalid-reset-password-token',
  imports: [PipesModule],
  templateUrl: './invalid-reset-password-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidResetPasswordTokenComponent {}
