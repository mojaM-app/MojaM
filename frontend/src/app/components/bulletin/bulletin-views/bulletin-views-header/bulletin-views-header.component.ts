import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { AuthService } from 'src/services/auth/auth.service';
import { PermissionService } from 'src/services/auth/permission.service';
import { AddBulletinMenu, BulletinListMenu } from '../../bulletin.menu';
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
export class BulletinViewsHeaderComponent implements OnInit {
  protected readonly AddBulletinMenu = AddBulletinMenu;
  protected readonly BulletinListMenu = BulletinListMenu;
  protected showButtonAdd: WritableSignal<boolean> = signal(false);
  protected showButtonList: WritableSignal<boolean> = signal(false);
  protected showButton = computed(() => this.showButtonAdd() || this.showButtonList());

  public constructor(
    authService: AuthService,
    private _permissionService: PermissionService
  ) {
    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.setViewModels();
      });
      authService.onAuthStateChanged.whenAuthenticated(() => {
        this.setViewModels();
      });
    });
  }

  public ngOnInit(): void {
    this.setViewModels();
  }

  protected setViewModels(): void {
    this.showButtonAdd.set(
      this._permissionService.hasPermission(SystemPermissionValue.AddBulletin)
    );
    this.showButtonList.set(
      this._permissionService.hasPermission(SystemPermissionValue.PreviewBulletinList)
    );
  }
}
