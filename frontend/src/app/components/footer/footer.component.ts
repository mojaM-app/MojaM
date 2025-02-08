import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsMenu } from '../announcements/announcements.menu';
import { BulletinMenu } from '../bulletin/bulletin.menu';
import { CalendarMenu } from '../calendar/calendar.menu';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule, MatToolbarModule, MatButtonModule],
})
export class FooterComponent {
  public AnnouncementsMenu = AnnouncementsMenu;
  public BulletinMenu = BulletinMenu;
  public CalendarMenu = CalendarMenu;

  public constructor(private _router: Router) {}

  public navigateTo(url: string): void {
    this._router.navigate(['/' + url]);
  }
}
