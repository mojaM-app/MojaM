import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-invalid-reset-pin-token',
  imports: [PipesModule],
  templateUrl: './invalid-reset-pin-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidResetPinTokenComponent {}
