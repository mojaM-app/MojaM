import { CalendarEvent } from 'src/interfaces/calendar/calendar-event';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';

export class EventPreviewModel {
  public readonly title?: string;
  public readonly content?: string;

  public constructor(
    event: CalendarEvent,
    cultureService: CultureService,
    translationService: TranslationService
  ) {
    this.title = this.getTitle(event, cultureService);
    this.content = this.getContent(event, cultureService, translationService);
  }

  private getTitle(event: CalendarEvent, cultureService: CultureService): string {
    return event.start.toLocaleDateString(cultureService.currentCulture, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    } satisfies Intl.DateTimeFormatOptions);
  }

  private getContent(
    event: CalendarEvent,
    cultureService: CultureService,
    translationService: TranslationService
  ): string {
    let result = `<b>${event.title}</b>`;

    if (event.allDay === true) {
      return result;
    }

    result += '<br/>' + translationService.get('Calendar/EventStart') + ': ';
    result += event.start.toLocaleTimeString(cultureService.currentCulture, {
      hour: '2-digit',
      minute: '2-digit',
    } satisfies Intl.DateTimeFormatOptions);

    if (event.end) {
      result += '<br/>' + translationService.get('Calendar/EventEnd') + ': ';
      result += event.end.toLocaleTimeString(cultureService.currentCulture, {
        hour: '2-digit',
        minute: '2-digit',
      } satisfies Intl.DateTimeFormatOptions);
    }

    if ((event.location?.length ?? 0) > 0) {
      result += '<br/>' + translationService.get('Shared/Location') + ': ';
      result += `<a href="${this.getMapsAddress(event.location!)}" target="_blank">${event.location}</a>`;
    }

    return result;
  }

  private getMapsAddress(location: string): string {
    //depends on device
    // For iOS devices
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      return `comgooglemaps://?daddr=${location}`;
    }
    // For Android devices
    else if (/Android/.test(navigator.userAgent)) {
      return `comgooglemaps://?daddr=${location}`;
    }
    // For other devices
    return `http://maps.google.com/?daddr=${location}`;
  }
}
