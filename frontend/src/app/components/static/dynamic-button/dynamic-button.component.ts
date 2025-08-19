import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-dynamic-button',
  templateUrl: './dynamic-button.component.html',
  imports: [MatButtonModule, MatIconModule, PipesModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicButtonComponent {
  public readonly label = input.required<string>();
  public readonly clicked = output<void>();

  protected onClick(): void {
    this.clicked.emit();
  }
}
