import { Pipe, PipeTransform } from '@angular/core';
import * as Globalize from 'globalize';
import { TranslationService } from 'src/services/translate/translation.service';
import { CultureService } from '../services/translate/culture.service';

@Pipe({
  name: 'gdatetime',
})
export class GdatetimePipe implements PipeTransform {
  public constructor(
    private _cultureService: CultureService,
    private _translationService: TranslationService
  ) {}

  public transform(value: Date, style?: string): string | null {
    if (value instanceof Date) {
      const format: Globalize.DateFormatterOptions = {};
      if (style) {
        if (style.indexOf('raw:') === 0) {
          format.raw = style.slice(4);
        } else if (style.indexOf('skeleton:') === 0) {
          format.skeleton = style.slice(9);
        } else {
          (format as any).datetime = style;
        }
      } else {
        format.raw = this._cultureService.dateTimeFormat;
      }

      return this._translationService.getGlobalize().dateFormatter(format)(value);
    }

    return null;
  }
}
