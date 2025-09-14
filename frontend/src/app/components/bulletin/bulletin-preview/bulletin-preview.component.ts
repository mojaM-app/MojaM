import { Inject, signal, OnInit, effect, WritableSignal } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IBulletin } from '../interfaces/bulletin';
import { ActivatedRoute, Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { BulletinService } from '../services/bulletin.service';
import { BulletinMenu } from '../bulletin.menu';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';

@Component({
  selector: 'app-bulletin-preview',
  imports: [],
  templateUrl: './bulletin-preview.component.html',
  styleUrl: './bulletin-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulletinPreviewComponent extends WithUnsubscribe() implements OnInit {
  protected readonly bulletin: WritableSignal<IBulletin | null> = signal(null);

  protected readonly showPublishInfo = signal<boolean>(false);

  public constructor(
    @Inject(IS_MOBILE) isMobile: boolean,
    private _bulletinService: BulletinService,
    private _route: ActivatedRoute,
    private _router: Router,
    authService: AuthService
  ) {
    super();

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToBulletins();
      });
    });

    effect(() => {
      this.showPublishInfo.set(authService.isAuthenticated());
    });
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (!GuidUtils.isValidGuid(id)) {
      this.navigateToBulletins();
      return;
    }

    this.addSubscription(
      this._bulletinService.get(id).subscribe((bulletin: IBulletin) => {
        if (bulletin && GuidUtils.isValidGuid(bulletin.id)) {
          this.setViewModels(bulletin);
        } else {
          this.navigateToBulletins();
        }
      })
    );
  }

  private navigateToBulletins(): void {
    this._router.navigateByUrl(BulletinMenu.Path);
  }

  private setViewModels(bulletin: IBulletin): void {
    this.bulletin.set(bulletin);
  }
}
