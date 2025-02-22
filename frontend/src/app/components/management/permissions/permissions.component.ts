import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DirectivesModule } from 'src/directives/directives.module';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { GuidUtils } from 'src/utils/guid.utils';
import { NewsMenu } from '../../news/news.menu';
import { BottomSheetService } from '../../static/bottom-sheet/bottom-sheet.service';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { IUserPermissions } from './interfaces/user-permissions.interface';
import { PermissionsTreeComponent } from './permissions-tree/permissions-tree.component';
import { PermissionsService } from './services/permissions.service';

@Component({
  selector: 'app-permissions',
  imports: [
    PipesModule,
    DirectivesModule,
    MatListModule,
    MatProgressBarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    CardHeaderComponent,
    PermissionsTreeComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent extends WithUnsubscribe() implements OnInit {
  public readonly selectedUser = signal<IUserPermissions | undefined>(undefined);

  public readonly filteredUsers = signal<IUserPermissions[] | undefined>(undefined);
  private readonly _users = signal<IUserPermissions[] | undefined>(undefined);

  public constructor(
    private _permissionsService: PermissionsService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _bottomSheetService: BottomSheetService,
    authService: AuthService,
    router: Router
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        router.navigateByUrl(NewsMenu.Path);
      })
    );
  }

  public ngOnInit(): void {
    this.addSubscription(
      this._permissionsService.get().subscribe((response: IUserPermissions[]) => {
        this._users.set(response);
        this.filteredUsers.set(response);
      })
    );
  }

  protected onUserSelected(value: MatSelectionListChange): void {
    const userId =
      typeof value.source._value === 'string'
        ? value.source._value
        : Array.isArray(value.source._value)
          ? value.source._value[0]
          : undefined;

    const user = GuidUtils.isValidGuid(userId)
      ? this._users()!.find(u => u.id === userId)
      : undefined;

    this.selectedUser.set(user);
  }

  protected handleFilterChanged(value: string): void {
    this.filteredUsers.set(
      this._users()!.filter(u => (u.name ?? '').toLowerCase().includes((value ?? '').toLowerCase()))
    );
  }

  protected showUserPermissions(userId: string): void {
    this.selectedUser.set(undefined);

    const user = GuidUtils.isValidGuid(userId)
      ? this._users()!.find(u => u.id === userId)
      : undefined;

    this._bottomSheetService.openUserPermissions(user).then(() => {
      this._changeDetectorRef.detectChanges();
    });
  }

  protected handlePermissionsSaved(): void {
    this._changeDetectorRef.detectChanges();
  }
}
