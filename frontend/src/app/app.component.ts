import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { DeviceService } from 'src/services/device/device.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
import { WithUnsubscribeOnDestroy } from 'src/utils/with-unsubscribe-on-destroy';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent extends WithUnsubscribeOnDestroy() implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public isMobile: boolean = true;
  public showSpinner: boolean = false;

  public constructor(
    deviceService: DeviceService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService
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
  }

  public closeSidenav(): void {
    this.sidenav?.close();
  }
}
