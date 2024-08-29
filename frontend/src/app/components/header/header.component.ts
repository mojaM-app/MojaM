import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  Inject,
  Input,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IS_MOBILE } from 'src/app/app.config';
import { PipesModule } from 'src/pipes/pipes.module';
import { ThemeService } from '../../../services/theme/theme.service';
import { LoginDialogComponent } from '../static/login/login-dialog/login-dialog.component';
import { AuthService } from 'src/services/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthTokenService } from 'src/services/auth/auth-token.service';
import { ITokenChangedEvent } from 'src/interfaces/auth/auth.events';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @Input() public sidenav: MatSidenav | undefined;

  public headerImageName = 'logo_black';
  public userName: string | undefined = undefined;
  public initials: string | undefined = undefined;

  private readonly _menuTrigger = viewChild.required(MatMenuTrigger);
  private readonly _dialog = inject(MatDialog);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _changeDetectorRef: ChangeDetectorRef,
    private _themeService: ThemeService,
    private _authTokenService: AuthTokenService,
    private _authService: AuthService
  ) {
    const tokenIsSet = toSignal<ITokenChangedEvent>(this._authTokenService.tokenChanged);

    effect(() => {
      if (tokenIsSet()) {
        this.setUserName();
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
        this.headerImageName = 'logo_white';
      } else {
        this.headerImageName = 'logo_black';
      }
      this._changeDetectorRef.detectChanges();
    });

    this.setUserName();
  }

  public openSidenav(): void {
    this.sidenav?.open();
  }

  public showLoginDialog(): void {
    const dialogRef = this._dialog.open(LoginDialogComponent, {
      restoreFocus: false,
      width: '90%',
      maxWidth: '35rem',
    });

    dialogRef.afterClosed().subscribe(() => this._menuTrigger().focus());
  }

  public logOut(): void {
    this._authService.logout();
  }

  private setUserName(): void {
    this.userName = this._authTokenService.getUserName();
    this.initials = this._authTokenService.getUserInitialLetters();
    this._changeDetectorRef.detectChanges();
  }
}
