import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from 'src/services/translate/translation.service';
import { BooleanUtils } from 'src/utils/boolean.utils';
import { CultureService } from '../services/translate/culture.service';

@Pipe({
  name: 'yesNo',
  standalone: false,
})
export class YesNoPipe implements PipeTransform {
  public constructor(
    private _cultureService: CultureService,
    private _translationService: TranslationService
  ) {}

  public transform(value: any): string {
    const bool = BooleanUtils.toBoolean(value);
    return bool
      ? this._translationService.get('Shared/Yes')
      : this._translationService.get('Shared/No');
  }
}
