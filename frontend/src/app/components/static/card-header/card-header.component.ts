import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-card-header',
  imports: [CommonModule, MatIconModule, MatButtonModule, PipesModule],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeaderComponent {
  public readonly title = input.required<string>();
  public readonly hasButtons = signal<boolean>(false);

  private _buttonsContainer = viewChild<ElementRef<HTMLDivElement>>('buttonsContainer');

  public constructor() {
    effect(() => {
      if ((this._buttonsContainer()?.nativeElement.children.length ?? 0) > 0) {
        this.hasButtons.set(true);
      }
    });
  }
}
