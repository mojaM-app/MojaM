import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AddAnnouncementsDto } from '../models/add-announcements.model';

@Component({
  selector: 'app-add-announcements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AnnouncementsFormComponent, PipesModule],
  templateUrl: './add-announcements.component.html',
  styleUrl: './add-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAnnouncementsComponent {
  private _form = viewChild(AnnouncementsFormComponent);

  public readonly announcements: AddAnnouncementsDto;

  public constructor() {
    this.announcements = AddAnnouncementsDto.create();
  }

  public save(): void {
    const form = this._form();

    if (!form) {
      return;
    }

    if (form.isReadyToSubmit()) {
      console.log(form.value);
    }
  }
}
