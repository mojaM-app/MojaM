import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import {
  ICurrentAnnouncements,
  IGetCurrentAnnouncements,
} from 'src/app/components/announcements/interfaces/current-announcements';
import { CurrentAnnouncementsService } from 'src/app/components/announcements/services/current-announcements.service';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { AddAnnouncementsMenu, AnnouncementsListMenu } from './announcements.menu';
import { BasePreviewAnnouncementComponent } from './preview-announcements/base-preview-announcement.component';
import { PullToRefreshService } from 'src/services/pull-to-refresh/pull-to-refresh.service';

@Component({
  selector: 'app-current-announcements',
  templateUrl: './current-announcements.component.html',
  styleUrls: ['./current-announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CurrentAnnouncementsComponent
  extends BasePreviewAnnouncementComponent
  implements OnInit
{
  protected readonly AddAnnouncementsMenu = AddAnnouncementsMenu;
  protected readonly AnnouncementsListMenu = AnnouncementsListMenu;

  protected readonly showButtonAddAnnouncement: WritableSignal<boolean> = signal(false);
  protected readonly showButtonGoToAnnouncementList: WritableSignal<boolean> = signal(false);
  protected readonly showPublishInfo = signal<boolean>(false);

  public constructor(
    @Inject(IS_MOBILE) isMobile: boolean,
    private _currentAnnouncementsService: CurrentAnnouncementsService,
    private _permissionService: PermissionService,
    translationService: TranslationService,
    cultureService: CultureService,
    router: Router,
    authService: AuthService,
    pullToRefreshService: PullToRefreshService
  ) {
    super(isMobile, translationService, cultureService, router);

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.ngOnInit();
      });

      authService.onAuthStateChanged.whenAuthenticated(() => {
        this.ngOnInit();
      });
    });

    effect(() => {
      this.showPublishInfo.set(authService.isAuthenticated());
    });

    if (pullToRefreshService.refresh()) {
      this.ngOnInit();
    }
  }

  public ngOnInit(): void {
    this.addSubscription(
      this._currentAnnouncementsService.get().subscribe((resp: IGetCurrentAnnouncements) => {
        const currentAnnouncements = resp?.currentAnnouncements ?? null;
        const announcementsCount = resp?.announcementsCount ?? 0;
        if (currentAnnouncements) {
          this.setViewModels(currentAnnouncements);
        } else {
          this.setEmptyAnnouncements(announcementsCount);
        }
      })
    );
  }

  protected override setViewModels(announcements: ICurrentAnnouncements): void {
    this.title.set(this.getAnnouncementsTitle(announcements));

    this.showButtonAddAnnouncement.set(
      this._permissionService.hasPermission(SystemPermissionValue.AddAnnouncements)
    );

    this.showButtonGoToAnnouncementList.set(
      this._permissionService.hasPermission(SystemPermissionValue.PreviewAnnouncementsList)
    );

    this.announcements.set(announcements);
  }

  private setEmptyAnnouncements(announcementsCount: number): void {
    this.title.set(this._translationService.get('Announcements/NoAnnouncements'));

    this.showButtonAddAnnouncement.set(
      announcementsCount === 0 &&
        this._permissionService.hasPermission(SystemPermissionValue.AddAnnouncements)
    );

    this.showButtonGoToAnnouncementList.set(
      announcementsCount > 0 &&
        this._permissionService.hasPermission(SystemPermissionValue.PreviewAnnouncementsList)
    );
  }
}
