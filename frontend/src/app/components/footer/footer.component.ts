import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { PipesModule } from 'src/pipes/pipes.module';
import { BulletinMenu } from '../bulletin/bulletin.menu';
import { CommunityMenu } from '../community/community.menu';
import { AnnouncementsMenu } from '../news/news.menu';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule, MatToolbarModule, MatButtonModule],
})
export class FooterComponent {
  public AnnouncementsMenu = AnnouncementsMenu;
  public BulletinMenu = BulletinMenu;
  public CommunityMenu = CommunityMenu;

  public constructor(private _router: Router) {}

  public navigateTo(url: string): void {
    this._router.navigate(['/' + url]);
  }
}
