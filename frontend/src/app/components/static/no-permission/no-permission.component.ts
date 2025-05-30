import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PipesModule } from '../../../../pipes/pipes.module';

@Component({
  selector: 'app-no-permission',
  templateUrl: './no-permission.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule],
})
export class NoPermissionComponent {}
