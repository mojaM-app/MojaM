import * as Globalize from 'globalize';
import { Pipe, PipeTransform } from '@angular/core';
import { CultureService } from 'src/services/translate/culture.service';

@Pipe({
  name: 'gtime'
})
export class GtimePipe implements PipeTransform {
  public constructor(private _cultureService: CultureService) {}

  public transform(value: Date, style?: string): string | null {
    if (value instanceof Date) {
      const format: Globalize.DateFormatterOptions = {};
      if (style) {
        if (style.indexOf('raw:') === 0) {
          format.raw = style.slice(4);
        } else if (style.indexOf('skeleton:') === 0) {
          format.skeleton = style.slice(9);
        } else {
          (format as any).time = style;
        }
      } else {
        format.raw = this._cultureService.timeFormat;
      }
      return Globalize.dateFormatter(format)(value);
    }

    return null;
  }
}
