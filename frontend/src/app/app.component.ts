import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { DeviceService } from 'src/services/device/device.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public isMobile: boolean = true;

  public constructor(deviceService: DeviceService) {
    this.isMobile = deviceService.isMobile();
  }

  public closeSidenav(): void {
    this.sidenav?.close();
  }
}
