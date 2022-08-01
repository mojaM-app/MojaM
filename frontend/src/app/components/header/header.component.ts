import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  @Input() sidenav: MatSidenav | undefined;

  constructor() {}

  public ngOnInit(): void {}

  public openSidenav() {
    this.sidenav?.open();
  }
}
