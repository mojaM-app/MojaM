import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-display-info',
  imports: [MatExpansionModule],
  templateUrl: './display-info.component.html',
  styleUrl: './display-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayInfoComponent {
  public readonly screenInfo: WritableSignal<string[] | undefined> = signal(undefined);

  public constructor(
    private _deviceDetectorService: DeviceDetectorService,
    el: ElementRef
  ) {
    setTimeout(() => {
      const info: string[] = [];
      info.push(`window inner size: ${window.innerWidth}x${window.innerHeight}`);
      info.push(`window outer size: ${window.outerWidth}x${window.outerHeight}`);
      info.push(`screen size: ${screen.width}x${screen.height}`);
      info.push(`screen avail size: ${screen.availWidth}x${screen.availHeight}`);
      info.push(
        `document element client size: ${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`
      );
      info.push(
        `document element offset size: ${document.documentElement.offsetWidth}x${document.documentElement.offsetHeight}`
      );
      info.push(`device pixel ratio: ${window.devicePixelRatio}`);
      info.push(
        `UserAgent: ${navigator.userAgent} (is mobile: ${/Mobi/.test(navigator.userAgent)})`
      );
      info.push(
        `safe-area-inset-top: ${getComputedStyle(document.documentElement).getPropertyValue('--sat')}`
      );
      info.push(
        `safe-area-inset-right: ${getComputedStyle(document.documentElement).getPropertyValue('--sar')}`
      );
      info.push(
        `safe-area-inset-bottom: ${getComputedStyle(document.documentElement).getPropertyValue('--sab')}`
      );
      info.push(
        `safe-area-inset-left: ${getComputedStyle(document.documentElement).getPropertyValue('--sal')}`
      );
      info.push(
        `--main-container-width: ${getComputedStyle(document.documentElement).getPropertyValue('--main-container-width')}`
      );
      info.push(
        `--main-container-height: ${getComputedStyle(document.documentElement).getPropertyValue('--main-container-height')}`
      );

      info.push('main-content-width:' + el.nativeElement.offsetWidth);
      info.push('main-content-height:' + el.nativeElement.offsetHeight);
      this.screenInfo.set(info);
    }, 500);
  }

  public deviceInfo1(): string[] {
    const result = [];
    const deviceInfo = this._deviceDetectorService.getDeviceInfo();
    result.push(`Device: ${deviceInfo.device}`);
    result.push(`Device Type: ${deviceInfo.deviceType}`);
    result.push(`OS: ${deviceInfo.os}`);
    result.push(`OS Version: ${deviceInfo.os_version}`);
    result.push(`Browser: ${deviceInfo.browser}`);
    result.push(`Browser Version: ${deviceInfo.browser_version}`);
    result.push(`Orientation: ${deviceInfo.orientation}`);
    return result;
  }
  public deviceInfo2(): string[] {
    const module = {
      options: [],
      header: [navigator.platform, navigator.userAgent, navigator.appVersion, navigator.vendor],
      dataos: [
        { name: 'Windows Phone', value: 'Windows Phone', version: 'OS' },
        { name: 'Windows', value: 'Win', version: 'NT' },
        { name: 'iPhone', value: 'iPhone', version: 'OS' },
        { name: 'iPad', value: 'iPad', version: 'OS' },
        { name: 'Kindle', value: 'Silk', version: 'Silk' },
        { name: 'Android', value: 'Android', version: 'Android' },
        { name: 'PlayBook', value: 'PlayBook', version: 'OS' },
        { name: 'BlackBerry', value: 'BlackBerry', version: '/' },
        { name: 'Macintosh', value: 'Mac', version: 'OS X' },
        { name: 'Linux', value: 'Linux', version: 'rv' },
        { name: 'Palm', value: 'Palm', version: 'PalmOS' },
      ],
      databrowser: [
        { name: 'Chrome', value: 'Chrome', version: 'Chrome' },
        { name: 'Firefox', value: 'Firefox', version: 'Firefox' },
        { name: 'Safari', value: 'Safari', version: 'Version' },
        { name: 'Internet Explorer', value: 'MSIE', version: 'MSIE' },
        { name: 'Opera', value: 'Opera', version: 'Opera' },
        { name: 'BlackBerry', value: 'CLDC', version: 'CLDC' },
        { name: 'Mozilla', value: 'Mozilla', version: 'Mozilla' },
      ],
      init: function (): any {
        const agent = this.header.join(' '),
          os = this.matchItem(agent, this.dataos),
          browser = this.matchItem(agent, this.databrowser);

        return { os: os, browser: browser };
      },
      matchItem: function (string: string, data: any[]): any {
        let i = 0,
          j = 0,
          regex,
          regexv,
          match,
          matches,
          version;

        for (i = 0; i < data.length; i += 1) {
          regex = new RegExp(data[i].value, 'i');
          match = regex.test(string);
          if (match) {
            regexv = new RegExp(data[i].version + '[- /:;]([\\d._]+)', 'i');
            matches = string.match(regexv);
            version = '';
            if (matches) {
              if (matches[1]) {
                matches = matches[1];
              }
            }
            if (matches && matches.length > 0) {
              matches = (matches as string).split(/[._]+/);
              for (j = 0; j < matches.length; j += 1) {
                if (j === 0) {
                  version += matches[j] + '.';
                } else {
                  version += matches[j];
                }
              }
            } else {
              version = '0';
            }
            return {
              name: data[i].name,
              version: parseFloat(version),
            };
          }
        }
        return { name: 'unknown', version: 0 };
      },
    };

    const e = module.init();
    const result = [];

    result.push('os.name = ' + e.os.name);
    result.push('os.version = ' + e.os.version);
    result.push('browser.name = ' + e.browser.name);
    result.push('browser.version = ' + e.browser.version);

    result.push('navigator.userAgent = ' + navigator.userAgent);
    result.push('navigator.appVersion = ' + navigator.appVersion);
    result.push('navigator.platform = ' + navigator.platform);
    result.push('navigator.vendor = ' + navigator.vendor);

    return result;
  }
}
