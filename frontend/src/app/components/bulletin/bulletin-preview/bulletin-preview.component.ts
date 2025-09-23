import { Inject, signal, OnInit, effect, WritableSignal } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IBulletin } from '../interfaces/bulletin';
import { ActivatedRoute, Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { BulletinService } from '../services/bulletin.service';
import { BulletinListMenu, BulletinMenu, EditBulletinMenu } from '../bulletin.menu';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { PreviewBulletinSectionComponent } from './preview-bulletin-section/preview-bulletin-section.component';
import { PreviewBulletinDayComponent } from './preview-bulletin-day/preview-bulletin-day.component';
import { PermissionService } from 'src/services/auth/permission.service';
import { SystemPermissionValue } from 'src/core/system-permission.enum';

@Component({
  selector: 'app-bulletin-preview',
  imports: [
    MatButtonModule,
    MatIconModule,
    PipesModule,
    PreviewBulletinSectionComponent,
    PreviewBulletinDayComponent,
  ],
  templateUrl: './bulletin-preview.component.html',
  styleUrl: './bulletin-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulletinPreviewComponent extends WithUnsubscribe() implements OnInit {
  protected readonly bulletin: WritableSignal<IBulletin | null> = signal(null);

  protected readonly showPublishInfo = signal<boolean>(false);
  protected readonly showEditButton = signal<boolean>(false);

  public constructor(
    @Inject(IS_MOBILE) isMobile: boolean,
    private _bulletinService: BulletinService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _permissionService: PermissionService,
    authService: AuthService
  ) {
    super();

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this._router.navigateByUrl(BulletinMenu.Path);
      });
    });

    effect(() => {
      this.showPublishInfo.set(authService.isAuthenticated());
    });

    this.showEditButton.set(
      this._permissionService.hasPermission(SystemPermissionValue.EditBulletin)
    );
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (!GuidUtils.isValidGuid(id)) {
      this.navigateToBulletinList();
      return;
    }

    this.addSubscription(
      this._bulletinService.get(id).subscribe((bulletin: IBulletin) => {
        if (bulletin && GuidUtils.isValidGuid(bulletin.id)) {
          this.setViewModels(bulletin);
        } else {
          this.navigateToBulletinList();
        }
      })
    );
  }

  protected cancel(): void {
    this.navigateToBulletinList();
  }

  protected edit(): void {
    this._router.navigate([EditBulletinMenu.Path, this.bulletin()!.id]);
  }

  private navigateToBulletinList(): void {
    this._router.navigateByUrl(BulletinListMenu.Path);
  }

  private setViewModels(bulletin: IBulletin): void {
    this.bulletin.set(bulletin);
  }
}
