import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { AuthService } from 'src/services/auth/auth.service';
import { GridModule } from '../../static/grid/grid.module';
import { AddAnnouncementsMenu, AnnouncementsMenu } from '../announcements.menu';
import { AnnouncementsGridService } from './announcements-grid.service';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [RouterModule, GridModule],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: 'gridService', useClass: AnnouncementsGridService }],
})
export class AnnouncementsListComponent extends WithUnsubscribe() {
  public readonly AddAnnouncementsMenu = AddAnnouncementsMenu;

  public constructor(authService: AuthService, router: Router) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        router.navigateByUrl(AnnouncementsMenu.Path);
      })
    );
  }
}
