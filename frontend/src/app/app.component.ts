import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { NgxResizeObserverModule } from 'ngx-resize-observer';
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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent extends WithUnsubscribe() implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public showSpinner = false;

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService,
    private _browserService: BrowserWindowService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.addSubscription(
      this._spinnerService.onStateChanged$().subscribe((state: boolean) => {
        this.showSpinner = state;
        this._changeDetectorRef.detectChanges();
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
