import { CalendarEvent } from 'src/app/components/calendar/interfaces/calendar-event';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { UrlUtils } from 'src/utils/url.utils';

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
      result += `<a href="${UrlUtils.getMapsAddress(event.location!)}" target="_blank" rel="noopener noreferrer">${event.location}</a>`;
    }

    return result;
  }
}
