import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsListComponent {}
