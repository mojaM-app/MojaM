import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { PipesModule } from 'src/pipes/pipes.module';
import { DeviceService } from 'src/services/device/device.service';
import { SpinnerService } from 'src/services/spinner/spinner.service';
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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public isMobile = true;
  public showSpinner = false;

  public constructor(
    deviceService: DeviceService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService
  ) {
    this.isMobile = deviceService.isMobile();
  }

  public ngOnInit(): void {
    this._spinnerService.onStateChanged$().subscribe((state: boolean) => {
      this.showSpinner = state;
      this._changeDetectorRef.detectChanges();
    });
  }

  public closeSidenav(): void {
    this.sidenav?.close();
  }
}
