import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { WysiwygPreviewComponent } from '../../static/wysiwyg-editor/wysiwyg-preview/wysiwyg-preview.component';
import { IAnnouncements } from '../interfaces/announcements';
import { AnnouncementsService } from '../services/announcements.service';
import { BasePreviewAnnouncementComponent } from './base-preview-announcement.component';

@Component({
  selector: 'app-preview-announcements',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    WysiwygPreviewComponent,
    PipesModule,
    DirectivesModule,
    FormsModule,
  ],
  templateUrl: './preview-announcements.component.html',
  styleUrl: './preview-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewAnnouncementsComponent
  extends BasePreviewAnnouncementComponent
  implements OnInit
{
  public constructor(
    @Inject(IS_MOBILE) isMobile: boolean,
    private _announcementsService: AnnouncementsService,
    private _route: ActivatedRoute,
    translationService: TranslationService,
    cultureService: CultureService,
    router: Router,
    authService: AuthService
  ) {
    super(isMobile, translationService, cultureService, router);

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.navigateToAnnouncements();
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
          this.setViewModels(announcements);
        } else {
          this.navigateToAnnouncementsList();
        }
      })
    );
  }
}
