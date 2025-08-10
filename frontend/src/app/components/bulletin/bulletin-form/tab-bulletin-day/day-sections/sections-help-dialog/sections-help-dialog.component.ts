import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-sections-help-dialog',
  imports: [PipesModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './sections-help-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionsHelpDialogComponent {}
