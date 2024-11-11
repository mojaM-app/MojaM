import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsMenu } from '../announcements.menu';
import { EditAnnouncementsDto } from '../models/edit-announcements.model';

@Component({
  selector: 'app-edit-announcements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AnnouncementsFormComponent, PipesModule],
  templateUrl: './edit-announcements.component.html',
  styleUrl: './edit-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAnnouncementsComponent extends WithUnsubscribe() {
  public announcements: EditAnnouncementsDto = new EditAnnouncementsDto();

  public constructor(authService: AuthService, router: Router) {
    super();

    this.addSubscription(
      authService.isAuthenticated.subscribe((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          router.navigateByUrl(AnnouncementsMenu.Path);
        }
      })
    );
  }
}
