import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgxResizeObserverModule } from 'ngx-resize-observer';
import { distinctUntilChanged, filter } from 'rxjs';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowSize } from 'src/services/browser/browser-window-size';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { IS_MOBILE } from './app.config';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    SideMenuComponent,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    PipesModule,
    NgxResizeObserverModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent extends WithUnsubscribe() implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public readonly footerShouldBeVisible = signal<boolean>(true);
  public readonly sideNavShouldBeOpened = signal<boolean>(true);
  public readonly showSpinner = signal<boolean>(false);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _spinnerService: SpinnerService,
    private _browserService: BrowserWindowService,
    router: Router
  ) {
    super();

    this.addSubscription(
      router.events
        .pipe(
          filter(e => e instanceof NavigationEnd),
          distinctUntilChanged()
        )
        .subscribe(event => {
          this.setSideNavShouldBeOpened(event as NavigationEnd);
          this.setFooterShouldBeVisible(event as NavigationEnd);
        })
    );
  }

  public ngOnInit(): void {
    this.addSubscription(
      this._spinnerService.onStateChanged$().subscribe((state: boolean) => {
        this.showSpinner.set(state);
      })
    );

    this.addSubscription(
      this._browserService.onResize$.subscribe((size: BrowserWindowSize) => {
        document.documentElement.style.setProperty('--main-container-width', size.width + 'px');
        document.documentElement.style.setProperty('--main-container-height', size.height + 'px');
        document.documentElement.style.setProperty('--is-mobile', this.isMobile ? '1' : '0');
      })
    );
  }

  public closeSidenav(): void {
    this.sidenav?.close();
  }

  public onResize(mainContainerSize: ResizeObserverEntry): void {
    this._browserService.emitEventOnWindowResize(mainContainerSize);
  }

  private setSideNavShouldBeOpened(location: NavigationEnd): void {
    const closeSideNavOnPaths = ['/reset-password/'];

    if (closeSideNavOnPaths.some(path => location?.url?.startsWith(path) === true)) {
      this.sideNavShouldBeOpened.set(false);
      return;
    }

    this.sideNavShouldBeOpened.set(true);
  }

  private setFooterShouldBeVisible(location: NavigationEnd): void {
    const hideFooterOnPaths = ['/reset-password/'];

    if (hideFooterOnPaths.some(path => location?.url?.startsWith(path) === true)) {
      this.footerShouldBeVisible.set(false);
      return;
    }

    this.footerShouldBeVisible.set(true);
  }
}
