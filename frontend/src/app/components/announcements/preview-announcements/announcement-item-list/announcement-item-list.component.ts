import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IAnnouncementItem } from '../../interfaces/announcements';
import { AnnouncementsItemComponent } from './announcement-item/announcements-item.component';

@Component({
  selector: 'app-announcement-item-list',
  imports: [AnnouncementsItemComponent],
  templateUrl: './announcement-item-list.component.html',
  styleUrl: './announcement-item-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementItemListComponent {
  public readonly items = input.required<IAnnouncementItem[]>();
}
