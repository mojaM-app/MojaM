import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  public constructor(private _deviceDetectorService: DeviceDetectorService) {}

  public isMobile(): boolean {
    return this._deviceDetectorService.isMobile() || this._deviceDetectorService.isTablet();
  }
}
