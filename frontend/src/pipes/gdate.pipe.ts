import * as Globalize from 'globalize';

import { Pipe, PipeTransform } from '@angular/core';
import { CultureService } from 'src/services/translate/culture.service';

@Pipe({
  name: 'gdate'
})
export class GdatePipe implements PipeTransform {
  public constructor(private _cultureService: CultureService) {}

  public transform(value: Date, style?: string, langCode?: string): string | null {
    if (value instanceof Date) {
      const format: Globalize.DateFormatterOptions = {};
      if (style) {
        if (style.indexOf('raw:') === 0) {
          format.raw = style.slice(4);
        } else {
          (format as any).date = style;
        }
      } else {
        format.raw = this._cultureService.dateFormat;
      }
      if (langCode) {
        try {
          return Globalize(langCode).dateFormatter(format)(value);
        } catch (ex) {
          if ((ex as any)?.code === 'E_MISSING_CLDR') {
            return Globalize.dateFormatter(format)(value);
          }
        }
      } else {
        return Globalize.dateFormatter(format)(value);
      }
    }

    return null;
  }
}
