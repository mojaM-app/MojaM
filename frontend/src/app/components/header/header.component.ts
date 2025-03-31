import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  Inject,
  Input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { IS_MOBILE } from 'src/app/app.config';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { AuthService } from 'src/services/auth/auth.service';
import { ITokenChangedEvent } from 'src/services/auth/events/auth.events';
import { DialogService } from 'src/services/dialog/dialog.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { ManagementMenuMyProfile } from '../management/management.menu';
import { ILoginDialogOptions } from '../static/login/login-dialog/login-dialog.options';
import { SnackBarService } from '../static/snackbar/snack-bar.service';
import { SnackBarActionTyp } from '../static/snackbar/snackbar-action-typ.enum';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @Input() public sidenav: MatSidenav | undefined;

  public readonly headerImageName = signal<string>('logo_black');
  public readonly userName = signal<string | undefined>(undefined);
  public readonly initials = signal<string | undefined>(undefined);
  public readonly isSessionValid = signal<boolean>(false);

  private readonly _menuTrigger = viewChild.required(MatMenuTrigger);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _changeDetectorRef: ChangeDetectorRef,
    private _themeService: ThemeService,
    private _authTokenService: AuthTokenService,
    private _authService: AuthService,
    private _dialogService: DialogService,
    private _router: Router,
    private _snackBarService: SnackBarService
  ) {
    const tokenChanged = toSignal<ITokenChangedEvent>(this._authTokenService.tokenChanged);
    this.isSessionValid.set(_authService.isSessionValid());

    effect(() => {
      if (tokenChanged()) {
        this.setViewData();
      }
    });
  }

  public ngAfterViewInit(): void {
    this.sidenav?.closedStart.subscribe(() => {
      this._changeDetectorRef.detectChanges();
    });
  }

  public ngOnInit(): void {
    this._themeService.onThemeChanged$().subscribe(() => {
      if (this._themeService.isDarkMode()) {
        this.headerImageName.set('logo_white');
      } else {
        this.headerImageName.set('logo_black');
      }
    });

    this._snackBarService.onActionCalled.subscribe(action => {
      switch (action.type) {
        case SnackBarActionTyp.CallRefreshSession:
          this.refreshSession();
          break;
      }
    });

    this.setViewData();
  }

  public openSidenav(): void {
    this.sidenav?.open();
  }

  protected showLoginDialog(options?: ILoginDialogOptions): void {
    const dialogRef = this._dialogService.openLoginComponent(options);

    dialogRef.afterClosed().subscribe(() => this._menuTrigger().focus());
  }

  protected refreshSession(): void {
    this.showLoginDialog({ setLoginData: true });
  }

  protected logOut(): void {
    this._authService.logout();
  }

  protected refreshMenu(): void {
    this.isSessionValid.set(this._authService.isSessionValid());
  }

  protected showUserProfile(): void {
    this._router.navigateByUrl(ManagementMenuMyProfile.Path);
  }

  private setViewData(): void {
    this.userName.set(this._authTokenService.getUserName());
    this.initials.set(this._authTokenService.getUserInitialLetters());
    this.refreshMenu();
  }
}
