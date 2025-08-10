import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { AddBulletinMenu } from '../../bulletin.menu';
import { PipesModule } from 'src/pipes/pipes.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bulletin-views-header',
  templateUrl: './bulletin-views-header.component.html',
  styleUrl: './bulletin-views-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatIconModule, MatButtonModule, RouterModule],
})
export class BulletinViewsHeaderComponent extends WithUnsubscribe() implements OnInit {
  protected readonly AddBulletinMenu = AddBulletinMenu;
  protected showButtonAdd: WritableSignal<boolean> = signal(false);

  public constructor(
    authService: AuthService,
    private _permissionService: PermissionService
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.ngOnInit();
      })
    );
  }

  public ngOnInit(): void {
    this.setViewModels();
  }

  protected setViewModels(): void {
    this.showButtonAdd.set(
      this._permissionService.hasPermission(SystemPermissionValue.AddBulletin)
    );
  }
}
