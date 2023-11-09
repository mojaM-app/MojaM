import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { untilDestroyed } from '@ngneat/until-destroy';
import { ThemeService } from 'src/services/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @Input() sidenav: MatSidenav | undefined;

  public headerImageName = 'logo_black';

  public constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _themeService: ThemeService
  ) {}

  public ngAfterViewInit(): void {
    this.sidenav?.closedStart.subscribe(() => {
      this._changeDetectorRef.detectChanges();
    });
  }

  public ngOnInit(): void {
    this._themeService
      .onThemeChanged$()
      .pipe(untilDestroyed(this))
      .subscribe((theme: string) => {
        if (this._themeService.isDarkMode()) {
          this.headerImageName = 'logo_white';
        } else {
          this.headerImageName = 'logo_black';
        }
        this._changeDetectorRef.detectChanges();
      });
  }

  public openSidenav() {
    this.sidenav?.open();
  }
}
