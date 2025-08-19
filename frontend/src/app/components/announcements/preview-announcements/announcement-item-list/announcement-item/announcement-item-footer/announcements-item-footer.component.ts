import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IAnnouncementItem } from 'src/app/components/announcements/interfaces/announcements';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-announcements-item-footer',
  templateUrl: './announcements-item-footer.component.html',
  styleUrls: ['./announcements-item-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule],
})
export class AnnouncementsItemFooterComponent {
  public readonly item = input.required<IAnnouncementItem>();
}
