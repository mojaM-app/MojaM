import * as Globalize from 'globalize';

import { Pipe, PipeTransform } from '@angular/core';
import { CultureService } from 'src/services/translate/culture.service';

@Pipe({
  name: 'gdatetime',
})
export class GdatetimePipe implements PipeTransform {
  public constructor(private _cultureService: CultureService) {}

  public transform(value: Date, style?: string): string | null {
    if (value instanceof Date) {
      const format: Globalize.DateFormatterOptions = {};
      if (style) {
        if (style.indexOf('raw:') === 0) {
          format.raw = style.slice(4);
        } else {
          (format as any).datetime = style;
        }
      } else {
        format.raw = this._cultureService.dateTimeFormat;
      }
      return Globalize.dateFormatter(format)(value);
    }

    return null;
  }
}
