import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PipesModule } from '../../../../pipes/pipes.module';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule],
})
export class NotFoundComponent {}
