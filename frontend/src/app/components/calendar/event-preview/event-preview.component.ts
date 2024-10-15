import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CalendarEvent } from 'src/interfaces/calendar/calendar-event';
import { PipesModule } from 'src/pipes/pipes.module';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { EventPreviewModel } from './event-preview.model';

@Component({
  selector: 'app-event-preview',
  standalone: true,
  templateUrl: './event-preview.component.html',
  styleUrl: './event-preview.component.scss',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    PipesModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPreviewComponent {
  public readonly model: EventPreviewModel;
  private readonly _data = inject(MAT_DIALOG_DATA);

  public constructor(cultureService: CultureService, translationService: TranslationService) {
    const event: CalendarEvent = this._data.event;
    this.model = new EventPreviewModel(event, cultureService, translationService);
  }
}
