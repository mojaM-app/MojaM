import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  @ViewChild('sidenav') public sidenav: MatSidenav | undefined;
  events: string[] = [];
  opened: boolean = false;

  closeSidenav() {
    this.sidenav?.close();
  }
}
