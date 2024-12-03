import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';
import {
  ICurrentAnnouncements,
  IGetCurrentAnnouncements,
} from 'src/app/components/announcements/interfaces/current-announcements';
import { CurrentAnnouncementsService } from 'src/app/components/announcements/services/current-announcements.service';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { GdatePipe } from 'src/pipes/gdate.pipe';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { AddAnnouncementsMenu, AnnouncementsListMenu } from './announcements.menu';

@Component({
  selector: 'app-current-announcements',
  templateUrl: './current-announcements.component.html',
  styleUrls: ['./current-announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentAnnouncementsComponent extends WithUnsubscribe() implements OnInit {
  public readonly AddAnnouncementsMenu = AddAnnouncementsMenu;
  public readonly AnnouncementsListMenu = AnnouncementsListMenu;

  public title: WritableSignal<string | null> = signal(null);
  public announcements: WritableSignal<ICurrentAnnouncements | null> = signal(null);
  public showButtonAddAnnouncement: WritableSignal<boolean> = signal(false);
  public showButtonGoToAnnouncementList: WritableSignal<boolean> = signal(false);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _currentAnnouncementsService: CurrentAnnouncementsService,
    private _translationService: TranslationService,
    private _cultureService: CultureService,
    private _permissionService: PermissionService,
    authService: AuthService
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.ngOnInit();
      })
    );
  }

  public ngOnInit(): void {
    this._currentAnnouncementsService.get().subscribe((resp: IGetCurrentAnnouncements) => {
      const currentAnnouncements = resp?.currentAnnouncements ?? null;
      const announcementsCount = resp?.announcementsCount ?? 0;
      if (currentAnnouncements) {
        let title = currentAnnouncements.title;
        if ((title?.length ?? 0) === 0) {
          title = this._translationService.get('Announcements/AnnouncementsOfTheDay', {
            date: new GdatePipe(this._cultureService, this._translationService).transform(
              currentAnnouncements.validFromDate
            ),
          });
        }
        this.title.set(title!);
        this.announcements.set(currentAnnouncements);
      } else {
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
    });
  }
}
