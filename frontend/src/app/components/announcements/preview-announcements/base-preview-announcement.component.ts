import { signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { GdatePipe } from 'src/pipes/gdate.pipe';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { AnnouncementsListMenu, AnnouncementsMenu } from '../announcements.menu';
import { IAnnouncements } from '../interfaces/announcements';
import { ICurrentAnnouncements } from '../interfaces/current-announcements';

export abstract class BasePreviewAnnouncementComponent extends WithUnsubscribe() {
  public title: WritableSignal<string | null> = signal(null);
  public announcements: WritableSignal<IAnnouncements | ICurrentAnnouncements | null> =
    signal(null);

  public constructor(
    protected isMobile: boolean,
    protected _translationService: TranslationService,
    protected _cultureService: CultureService,
    protected _router: Router
  ) {
    super();
  }

  public cancel(): void {
    this.navigateToAnnouncementsList();
  }

  protected setViewModels(announcements: IAnnouncements | ICurrentAnnouncements): void {
    this.title.set(this.getAnnouncementsTitle(announcements));
    this.announcements.set(announcements);
  }

  protected navigateToAnnouncementsList(): void {
    this._router.navigateByUrl(AnnouncementsListMenu.Path);
  }

  protected navigateToAnnouncements(): void {
    this._router.navigateByUrl(AnnouncementsMenu.Path);
  }

  protected getAnnouncementsTitle(announcements: IAnnouncements | ICurrentAnnouncements): string {
    let title = announcements.title;
    if ((title?.length ?? 0) === 0) {
      title = this._translationService.get(
        'Announcements/AnnouncementsOfTheDay',
        announcements.validFromDate
          ? {
              date: new GdatePipe(this._cultureService, this._translationService).transform(
                announcements.validFromDate
              ),
            }
          : {
              date: '',
            }
      );
    }
    return title!;
  }
}
