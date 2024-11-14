import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsService } from 'src/services/announcements/announcements.service';
import { AuthService } from 'src/services/auth/auth.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsMenu } from '../announcements.menu';
import { AddAnnouncementsDto } from '../models/add-announcements.model';

@Component({
  selector: 'app-add-announcements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AnnouncementsFormComponent, PipesModule],
  templateUrl: './add-announcements.component.html',
  styleUrl: './add-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAnnouncementsComponent extends WithUnsubscribe() {
  public readonly announcements: AddAnnouncementsDto;

  private _form = viewChild(AnnouncementsFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _announcementsService: AnnouncementsService,
    private _snackBarService: SnackBarService
  ) {
    super();

    this.announcements = AddAnnouncementsDto.create();

    this.addSubscription(
      authService.isAuthenticated.subscribe((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.navigateToAnnouncements();
        }
      })
    );
  }

  public save(): void {
    const form = this._form();

    if (!form) {
      return;
    }

    if (!form.isReadyToSubmit()) {
      this._snackBarService.translateAndShowError('Announcements/Form/CheckProvidedData');
      return;
    }

    const dto = new AddAnnouncementsDto(form.controls);
    this._announcementsService.create(dto).subscribe(() => {
      this.navigateToAnnouncements();
    });
  }

  public cancel(): void {
    this.navigateToAnnouncements();
  }

  private navigateToAnnouncements(): void {
    this._router.navigateByUrl(AnnouncementsMenu.Path);
  }
}
