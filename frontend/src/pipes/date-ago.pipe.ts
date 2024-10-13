/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translate/translation.service';

interface ICachedFormatter {
  key: string;
  interval: number;
  lang: string | null;
  func: (...args: any[]) => void;
}

@Pipe({
  name: 'dateAgo',
  pure: true,
})
export class DateAgoPipe implements PipeTransform {
  private static formatters: ICachedFormatter[] = [
    { key: 'Pipes/date-ago/years', interval: 31536000, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/months', interval: 2592000, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/weeks', interval: 604800, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/days', interval: 86400, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/hours', interval: 3600, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/minutes', interval: 60, lang: '-', func: () => null },
    { key: 'Pipes/date-ago/just-now', interval: -5, lang: '-', func: () => null },
  ];

  public constructor(private _translationService: TranslationService) {}

  public transform(value: any): any {
    if (!value) {
      return value;
    }

    const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);

    for (const formatter of DateAgoPipe.formatters) {
      if (seconds < formatter.interval) {
        continue;
      }

      if (formatter.lang !== this._translationService.currentLang) {
        formatter.func = this._translationService.getFormatter(formatter.key);
        formatter.lang = this._translationService.currentLang;
      }

      const elapsed = formatter.interval > 0 ? Math.floor(seconds / formatter.interval) : seconds;

      return formatter.func(elapsed);
    }

    return this._translationService.getGlobalize().formatDate(value, { date: 'short' });
  }
}
