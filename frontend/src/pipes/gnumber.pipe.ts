import { Pipe, PipeTransform } from '@angular/core';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';

@Pipe({
  name: 'gnumber',
  standalone: false,
})
export class GnumberPipe implements PipeTransform {
  public constructor(
    private _cultureService: CultureService,
    private _translationService: TranslationService
  ) {}

  public transform(value: number, style?: string, maximumFractionDigits?: number): string | null {
    if (typeof value === 'number') {
      const options: any = {};
      if (typeof style === 'string') {
        options.style = style;
      }
      if (typeof maximumFractionDigits === 'number') {
        options.maximumFractionDigits = maximumFractionDigits;
      }

      return this._translationService.getGlobalize().numberFormatter(options)(value);
    }

    return null;
  }
}
