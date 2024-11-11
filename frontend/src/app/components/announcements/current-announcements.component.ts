import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { IS_MOBILE } from 'src/app/app.config';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { ICurrentAnnouncements } from 'src/interfaces/announcements/announcements';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { GdatePipe } from 'src/pipes/gdate.pipe';
import { CurrentAnnouncementsService } from 'src/services/announcements/current-announcements.service';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { AddAnnouncementsMenu } from './announcements.menu';

@Component({
  selector: 'app-current-announcements',
  templateUrl: './current-announcements.component.html',
  styleUrls: ['./current-announcements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentAnnouncementsComponent extends WithUnsubscribe() implements OnInit {
  public AddAnnouncementsMenu = AddAnnouncementsMenu;

  public title: WritableSignal<string | null> = signal(null);
  public announcements: WritableSignal<ICurrentAnnouncements | null> = signal(null);
  public showButtonAddAnnouncement: WritableSignal<boolean> = signal(false);

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
      authService.isAuthenticated.subscribe(() => {
        this.ngOnInit();
      })
    );
  }

  public ngOnInit(): void {
    this._currentAnnouncementsService.get().subscribe((resp: ICurrentAnnouncements | null) => {
      if (resp) {
        let title = resp.title;
        if ((title?.length ?? 0) === 0) {
          title = this._translationService.get('Announcements/AnnouncementsOfTheDay', {
            date: new GdatePipe(this._cultureService, this._translationService).transform(
              resp.validFromDate
            ),
          });
        }
        this.title.set(title!);
        this.announcements.set(resp);
      } else {
        this.title.set(this._translationService.get('Announcements/NoAnnouncements'));
        this.showButtonAddAnnouncement.set(
          this._permissionService.hasPermission(SystemPermissionValue.AddAnnouncements)
        );
      }
    });
  }
}
