import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IBulletinSectionSettingsForm } from '../../../../bulletin.form';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from 'src/pipes/pipes.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SectionType } from 'src/app/components/bulletin/enums/section-type.enum';

@Component({
  selector: 'app-section-settings',
  imports: [
    CommonModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './section-settings.component.html',
  styleUrl: './section-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSettingsComponent {
  protected settings: FormGroup<IBulletinSectionSettingsForm> | undefined = undefined;
  protected sectionTitle: string | null = null;
}
