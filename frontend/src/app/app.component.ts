import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  Inject,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { NgxResizeObserverModule } from 'ngx-resize-observer';
import { distinctUntilChanged, filter, map, mergeMap } from 'rxjs';
import { IRouteData } from 'src/interfaces/common/route.data';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowSize } from 'src/services/browser/browser-window-size';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { FontSizeService } from 'src/services/theme/font-size.service';
import { ThemeService } from 'src/services/theme/theme.service';
import { IS_MOBILE } from './app.config';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
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

  public readonly footerShouldBeVisible: WritableSignal<boolean>;
  public readonly sideNavShouldBeOpened: WritableSignal<boolean>;
  public readonly showSpinner = signal<boolean>(false);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _spinnerService: SpinnerService,
    private _browserService: BrowserWindowService,
    router: Router,
    activatedRoute: ActivatedRoute,
    themeService: ThemeService,
    fontSizeService: FontSizeService,
    elRef: ElementRef
  ) {
    super();

    this.sideNavShouldBeOpened = signal(!(isMobile ?? false));
    this.footerShouldBeVisible = signal(isMobile ?? true);

    this.addSubscription(
      router.events
        .pipe(
          filter(e => e instanceof NavigationEnd),
          map(() => {
            let route = activatedRoute;

            while (route.firstChild) {
              route = route.firstChild;
            }

            return route;
          }),
          filter(route => route?.outlet === 'primary'),
          mergeMap(route => route?.data),
          distinctUntilChanged()
        )
        .subscribe((routeData: IRouteData) => {
          this.sideNavShouldBeOpened.set(
            isMobile === true ? false : !(routeData?.closeSideNav ?? false)
          );

          this.footerShouldBeVisible.set(!(routeData?.hideFooter ?? !isMobile));
        })
    );

    this.addSubscription(
      themeService.onThemeChanged$().subscribe((theme: string) => {
        elRef.nativeElement.setAttribute('data-bs-theme', theme);
      })
    );

    this.addSubscription(
      fontSizeService.onFontSizeChanged$().subscribe((fontSize: number) => {
        document.documentElement.style.setProperty('--font-size', (fontSize / 100).toString());
      })
    );

    effect(() => {
      document.documentElement.style.setProperty(
        '--footer-is-visible',
        this.footerShouldBeVisible() ? '1' : '0'
      );
    });
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
}
