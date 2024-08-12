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
import { PipesModule } from 'src/pipes/pipes.module';
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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;

  public showSpinner = false;

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    private _changeDetectorRef: ChangeDetectorRef,
    private _spinnerService: SpinnerService
  ) {}

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
