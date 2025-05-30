import { Pipe, PipeTransform } from '@angular/core';
import * as Globalize from 'globalize';
import { TranslationService } from 'src/services/translate/translation.service';
import { CultureService } from '../services/translate/culture.service';

@Pipe({
  name: 'gdate',
  standalone: false,
})
export class GdatePipe implements PipeTransform {
  public constructor(
    private _cultureService: CultureService,
    private _translationService: TranslationService
  ) {}

  public transform(value: Date | null | undefined, style?: string): string | null {
    if (value instanceof Date) {
      const format: Globalize.DateFormatterOptions = {};
      if (style) {
        if (style.indexOf('raw:') === 0) {
          format.raw = style.slice(4);
        } else if (style.indexOf('skeleton:') === 0) {
          format.skeleton = style.slice(9);
        } else {
          (format as any).date = style;
        }
      } else {
        format.raw = this._cultureService.dateFormat;
      }

      return this._translationService.getGlobalize().dateFormatter(format)(value);
    }

    return null;
  }
}
