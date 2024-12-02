import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-grid-toolbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PipesModule],
  templateUrl: './grid-toolbar.component.html',
  styleUrl: './grid-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridToolbarComponent {
  public title = input.required<string>();
}
