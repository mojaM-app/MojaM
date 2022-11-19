import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ThemeService } from 'src/services/theme/theme.service';
import { WithUnsubscribeOnDestroy } from 'src/utils/with-unsubscribe-on-destroy';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends WithUnsubscribeOnDestroy() implements OnInit, AfterViewInit {
  @Input() sidenav: MatSidenav | undefined;

  public headerImageName: string = 'logo_black';

  public constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _themeService: ThemeService
  ) {
    super();
  }

  public ngAfterViewInit(): void {
    this.sidenav?.closedStart.subscribe(() => {
      this._changeDetectorRef.detectChanges();
    });
  }

  public ngOnInit(): void {
    this.registerSubscription(
      this._themeService.onThemeChanged$().subscribe((theme: string) => {
        if (this._themeService.isDarkMode()) {
          this.headerImageName = 'logo_white';
        } else {
          this.headerImageName = 'logo_black';
        }
        this._changeDetectorRef.detectChanges();
      })
    );
  }

  public openSidenav() {
    this.sidenav?.open();
  }
}
