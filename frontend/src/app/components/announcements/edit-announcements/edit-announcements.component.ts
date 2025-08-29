import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  model,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsListMenu, AnnouncementsMenu } from '../announcements.menu';
import { IAnnouncements } from '../interfaces/announcements';
import { EditAnnouncementsDto } from '../models/edit-announcements.model';
import { AnnouncementsService } from '../services/announcements.service';
import { SaveAnnouncementsResultDto } from '../interfaces/save-announcements-result.dto';
import { IDialogSettings } from 'src/core/interfaces/common/dialog.settings';
import { DialogService } from 'src/services/dialog/dialog.service';

@Component({
  selector: 'app-edit-announcements',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    AnnouncementsFormComponent,
    PipesModule,
    CardHeaderComponent,
  ],
  templateUrl: './edit-announcements.component.html',
  styleUrl: './edit-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAnnouncementsComponent extends WithUnsubscribe() implements OnInit {
  protected readonly announcements = model<EditAnnouncementsDto>();

  private readonly _formComponent = viewChild(AnnouncementsFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _announcementsService: AnnouncementsService,
    private _dialogService: DialogService
  ) {
    super();

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToAnnouncements();
      });
    });
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

    if (!form || !form.containsValidData() || !GuidUtils.isValidGuid(this.announcements()?.id)) {
      form?.showErrors();
      return;
    }

    const dto = new EditAnnouncementsDto(this.announcements()!.id, form.controls);
    this._announcementsService.update(dto).subscribe(async (result: SaveAnnouncementsResultDto) => {
      if (result.showPublishDialog) {
        const confirmed = await this._dialogService
          .confirm({
            message: {
              text: 'Announcements/List/AskIfPublishSavedText',
            },
            noBtnText: 'Shared/BtnCancel',
            yesBtnText: 'Shared/BtnPublish',
          } satisfies IDialogSettings)
          .then((result: boolean) => result);

        if (confirmed === true) {
          this._announcementsService.publish(result.id).subscribe(() => {
            this.navigateToAnnouncementsList();
          });
        }

        return;
      }

      this.navigateToAnnouncementsList();
    });
  }

  public cancel(): void {
    this.navigateToAnnouncementsList();
  }

  private navigateToAnnouncementsList(): void {
    this._router.navigateByUrl(AnnouncementsListMenu.Path);
  }

  private navigateToAnnouncements(): void {
    this._router.navigateByUrl(AnnouncementsMenu.Path);
  }
}
