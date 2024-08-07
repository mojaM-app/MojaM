import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PipesModule } from 'src/pipes/pipes.module';
import { DeviceService } from 'src/services/device/device.service';
import { ThemeService } from '../../../services/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PipesModule, MatToolbarModule, MatIconModule, MatButtonModule],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @Input() sidenav: MatSidenav | undefined;

  public headerImageName: string = 'logo_black';
  public readonly isMobile: boolean = false;

  public constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _themeService: ThemeService,
    private _deviceService: DeviceService
  ) {
    this.isMobile = this._deviceService.isMobile();
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
  }

  public openSidenav(): void {
    this.sidenav?.open();
  }
}
