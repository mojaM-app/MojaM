import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { ICurrentAnnouncements } from '../../interfaces/current-announcements';
import { IAnnouncements } from '../../interfaces/announcements';

@Component({
  selector: 'app-announcements-publish-info',
  imports: [CommonModule, MatIconModule, PipesModule],
  templateUrl: './announcements-publish-info.component.html',
  styleUrl: './announcements-publish-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsPublishInfoComponent {
  public readonly announcements = input.required<IAnnouncements | ICurrentAnnouncements | null>();
}
