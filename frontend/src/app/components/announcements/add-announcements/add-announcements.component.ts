import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { IResponseError } from 'src/interfaces/errors/response.error';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsService } from 'src/services/announcements/announcements.service';
import { AuthService } from 'src/services/auth/auth.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsListMenu } from '../announcements.menu';
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

  private _formComponent = viewChild(AnnouncementsFormComponent);

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
          this.navigateToAnnouncementsList();
        }
      })
    );
  }

  public save(): void {
    const form = this._formComponent();

    if (!form || !form.containsValidData()) {
      return;
    }

    const dto = new AddAnnouncementsDto(form.controls);
    this._announcementsService.create(dto).subscribe({
      next: () => {
        this.navigateToAnnouncementsList();
      },
      error: (error: unknown) => {
        if ((error as IResponseError)?.errorMessage) {
          this._snackBarService.showError((error as IResponseError).errorMessage);
        } else {
          throw error;
        }
      },
    });
  }

  public cancel(): void {
    this.navigateToAnnouncementsList();
  }

  private navigateToAnnouncementsList(): void {
    this._router.navigateByUrl(AnnouncementsListMenu.Path);
  }
}
