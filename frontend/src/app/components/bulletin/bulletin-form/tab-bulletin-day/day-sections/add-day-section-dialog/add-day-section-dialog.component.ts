import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
  model,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SectionType } from 'src/app/components/bulletin/enums/section-type.enum';
import { PipesModule } from 'src/pipes/pipes.module';
import { DaySections, IMatOption } from '../day-sections';
import { IBulletinPropertiesForm } from '../../../bulletin.form';

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
  protected readonly sectionTypes: WritableSignal<IMatOption[]> = signal([]);

  protected readonly selectedSectionType = model<string | undefined>();

  public constructor(
    @Inject(MAT_DIALOG_DATA)
    private readonly _data:
      | { currentSections: SectionType[]; bulletinProperties: FormGroup<IBulletinPropertiesForm> }
      | null
      | undefined,
    private readonly _dialogRef: MatDialogRef<AddDaySectionDialogComponent>
  ) {
    this.sectionTypes.set(this.getSectionTypes());
    this.selectedSectionType.set(SectionType.CUSTOM_TEXT);
  }

  protected onAddClick(): void {
    this._dialogRef.close(this.selectedSectionType());
  }

  private getSectionTypes(): IMatOption[] {
    const sections = DaySections.getTypes(this._data?.bulletinProperties.value);
    const currentSections: SectionType[] = this._data?.currentSections ?? [];
    return sections.filter(
      s => s.value === SectionType.CUSTOM_TEXT || !currentSections.includes(s.value)
    );
  }
}
