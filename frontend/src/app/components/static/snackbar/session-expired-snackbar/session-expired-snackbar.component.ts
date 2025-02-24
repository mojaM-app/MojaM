import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarAction, MatSnackBarActions, MatSnackBarRef } from '@angular/material/snack-bar';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-session-expired-snackbar',
  imports: [MatButtonModule, MatIconModule, MatSnackBarAction, MatSnackBarActions, PipesModule],
  templateUrl: './session-expired-snackbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionExpiredSnackbarComponent {
  protected snackBarRef = inject(MatSnackBarRef);
}
