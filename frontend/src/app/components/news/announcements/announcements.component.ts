import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AnnouncementsService } from 'src/services/common/news/announcements.service';
import { BaseNewsComponent } from '../base-news.component';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementsComponent extends BaseNewsComponent implements OnInit
{
  public constructor(_service: AnnouncementsService) {
    super();
  }

  public ngOnInit(): void {}
}
