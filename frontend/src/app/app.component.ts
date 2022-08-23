import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { DeviceService } from 'src/services/device/device.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { ThemeService } from 'src/services/theme/theme.service';
import { WithUnsubscribeOnDestroy } from 'src/utils/with-unsubscribe-on-destroy';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent extends WithUnsubscribeOnDestroy() implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  private _themeName: string | null = null;

  public isMobile: boolean = true;
  public showSpinner: boolean = false;

  @HostBinding('class')
  public get themeName() {
    return this._themeName || ThemeService.DefaultTheme;
  }

  public constructor(
    deviceService: DeviceService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService,
    private _themeService: ThemeService
  ) {
    super();
    this.isMobile = deviceService.isMobile();
  }

  public ngOnInit(): void {
    this.registerSubscription(
      this._spinnerService.onStateChanged$().subscribe((state: boolean) => {
        this.showSpinner = state;
        this._changeDetectorRef.detectChanges();
      })
    );

    this.registerSubscription(
      this._themeService.onThemeChanged$().subscribe((theme: string) => {
        this._themeName = theme;
        this._changeDetectorRef.detectChanges();
      })
    );
  }

  public closeSidenav(): void {
    this.sidenav?.close();
  }
}
