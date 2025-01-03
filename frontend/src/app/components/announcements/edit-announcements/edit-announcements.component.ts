import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsListMenu } from '../announcements.menu';
import { IAnnouncements } from '../interfaces/announcements';
import { EditAnnouncementsDto } from '../models/edit-announcements.model';
import { AnnouncementsService } from '../services/announcements.service';

@Component({
  selector: 'app-edit-announcements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AnnouncementsFormComponent, PipesModule],
  templateUrl: './edit-announcements.component.html',
  styleUrl: './edit-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAnnouncementsComponent extends WithUnsubscribe() implements OnInit {
  public announcements = model<EditAnnouncementsDto>();

  private _formComponent = viewChild(AnnouncementsFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _announcementsService: AnnouncementsService
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.navigateToAnnouncementsList();
      })
    );
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (!GuidUtils.isValidGuid(id)) {
      this.navigateToAnnouncementsList();
      return;
    }

    this.addSubscription(
      this._announcementsService.get(id).subscribe((announcements: IAnnouncements) => {
        if (announcements && GuidUtils.isValidGuid(announcements.id)) {
          this.announcements.set(EditAnnouncementsDto.create(announcements));
        } else {
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

    const dto = new EditAnnouncementsDto(this.announcements()!.id!, form.controls);
    this._announcementsService.update(dto).subscribe(() => {
      this.navigateToAnnouncementsList();
    });
  }

  public cancel(): void {
    this.navigateToAnnouncementsList();
  }

  private navigateToAnnouncementsList(): void {
    this._router.navigateByUrl(AnnouncementsListMenu.Path);
  }
}
