import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { ICommunityInfo } from '../../interfaces/community.interfaces';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [MatIconModule, PipesModule],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class InfoComponent {
  public readonly model = input.required<ICommunityInfo | undefined>();
}
