import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ThemeService } from 'src/services/theme/theme.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuComponent {
  public isDarkMode = false;

  public constructor(private _themeService: ThemeService) {
    this.isDarkMode = this._themeService.isDarkMode();
  }

  public changed(arg: MatSlideToggleChange) {
    this._themeService.onOffDarkMode(arg.checked);
  }
}
