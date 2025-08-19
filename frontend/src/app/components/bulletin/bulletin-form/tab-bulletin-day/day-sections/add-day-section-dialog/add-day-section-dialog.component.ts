import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SectionType } from 'src/app/components/bulletin/enums/section-type.enum';
import { PipesModule } from 'src/pipes/pipes.module';
import { DaySections } from '../day-sections';

@Component({
  selector: 'app-add-day-section-dialog',
  imports: [
    CommonModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-day-section-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDaySectionDialogComponent {
  protected readonly sectionTypes: WritableSignal<
    { label: string; description: string; value: SectionType }[]
  > = signal([]);

  protected readonly selectedSectionType = model<string | undefined>();

  public constructor(private _dialogRef: MatDialogRef<AddDaySectionDialogComponent>) {
    this.sectionTypes.set(DaySections.getTypes());

    this.selectedSectionType.set(SectionType.CUSTOM_TEXT);
  }

  protected onAddClick(): void {
    this._dialogRef.close(this.selectedSectionType());
  }
}
