import { Injectable } from '@angular/core';
import { CalendarEvent, CalendarEventTitleFormatter } from 'angular-calendar';

@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
  public override monthTooltip(event: CalendarEvent, title: string): string {
    return '';
  }

  public override weekTooltip(event: CalendarEvent, title: string): string {
    return '';
  }

  public override dayTooltip(event: CalendarEvent, title: string): string {
    return '';
  }
}
