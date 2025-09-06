import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import {
  BulletinFormBuilder,
  IBulletinDaySectionForm,
  IBulletinPropertiesForm,
} from '../../bulletin.form';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { DialogService } from 'src/services/dialog/dialog.service';
import { AddDaySectionDialogComponent } from './add-day-section-dialog/add-day-section-dialog.component';
import { SectionType } from '../../../enums/section-type.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SectionsHelpDialogComponent } from './sections-help-dialog/sections-help-dialog.component';
import { DaySectionComponent } from './day-section/day-section.component';
import { DirectivesModule } from 'src/directives/directives.module';

@Component({
  selector: 'app-day-sections',
  imports: [
    CdkDropList,
    CdkDrag,
    CommonModule,
    PipesModule,
    DirectivesModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    DaySectionComponent,
  ],
  templateUrl: './day-sections.component.html',
  styleUrl: './day-sections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaySectionsComponent {
  public readonly sections = input.required<FormArray<FormGroup<IBulletinDaySectionForm>>>();
  public readonly bulletinProperties = input.required<FormGroup<IBulletinPropertiesForm>>();
  protected readonly sectionControls = computed(() => this.sections().controls);
  protected sectionTypes = SectionType;
  protected readonly selectedSection = signal<FormGroup<IBulletinDaySectionForm> | undefined>(
    undefined
  );

  public constructor(
    private readonly _bulletinFormBuilder: BulletinFormBuilder,
    private readonly _dialogService: DialogService,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {}

  protected drop(event: CdkDragDrop<FormArray<FormGroup<IBulletinDaySectionForm>>>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const array = this.sections();
    const moved = array.at(event.previousIndex);
    array.removeAt(event.previousIndex);
    array.insert(event.currentIndex, moved);
  }

  protected openAddSectionDialog(): void {
    this._dialogService
      .open(AddDaySectionDialogComponent, {
        width: '50%',
        data: {
          currentSections: this.sectionControls().map(s => s.value.type),
        },
      })
      .afterClosed()
      .subscribe((section: SectionType) => {
        if (section) {
          const newSection = this._bulletinFormBuilder.createDaySection({
            type: section,
          });
          this.sections().push(newSection);
          this.editSection(newSection);
          this._changeDetectorRef.markForCheck();
          this._changeDetectorRef.detectChanges();
        }
      });
  }

  protected openHelpSectionDialog(): void {
    this._dialogService.open(SectionsHelpDialogComponent, {
      width: '50%',
    });
  }

  protected editSection(section: FormGroup<IBulletinDaySectionForm>): void {
    this.selectedSection.set(section);
  }

  protected isSelected(section: FormGroup<IBulletinDaySectionForm>): boolean {
    return this.selectedSection() === section;
  }

  protected controlHasErrors(control: AbstractControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}
