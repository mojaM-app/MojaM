import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { EditAnnouncementsDto } from '../models/edit-announcements.model';

@Component({
  selector: 'app-edit-announcements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AnnouncementsFormComponent, PipesModule],
  templateUrl: './edit-announcements.component.html',
  styleUrl: './edit-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAnnouncementsComponent {
  public announcements: EditAnnouncementsDto = new EditAnnouncementsDto();
}
