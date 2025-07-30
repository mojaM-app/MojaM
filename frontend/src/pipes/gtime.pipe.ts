import { Pipe, PipeTransform } from '@angular/core';
import * as Globalize from 'globalize';
import { TranslationService } from 'src/services/translate/translation.service';
import { CultureService } from '../services/translate/culture.service';
import * as moment from 'moment';

@Pipe({
  name: 'gtime',
  standalone: false,
})
export class GtimePipe implements PipeTransform {
  public constructor(
    private _cultureService: CultureService,
    private _translationService: TranslationService
  ) {}

  public transform(value: Date | moment.Moment | null | undefined, style?: string): string | null {
    if (moment.isMoment(value)) {
      return this.transform(value.toDate());
    }

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

      return this._translationService.getGlobalize().dateFormatter(format)(value);
    }

    return null;
  }
}
