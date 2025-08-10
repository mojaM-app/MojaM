import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IBulletinDayForm, IBulletinPropertiesForm } from '../bulletin.form';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipesModule } from 'src/pipes/pipes.module';
import { BaseTabBulletin } from '../base-tab-bulletin';
import { DaySectionsComponent } from './day-sections/day-sections.component';

@Component({
  selector: 'app-tab-bulletin-day',
  imports: [
    CommonModule,
    PipesModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    DaySectionsComponent,
  ],
  templateUrl: './tab-bulletin-day.component.html',
  styleUrl: './tab-bulletin-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBulletinDayComponent extends BaseTabBulletin {
  public readonly bulletinProperties = input.required<FormGroup<IBulletinPropertiesForm>>();
  public readonly formGroup = input.required<FormGroup<IBulletinDayForm>>();

  public constructor() {
    super();
  }
}
