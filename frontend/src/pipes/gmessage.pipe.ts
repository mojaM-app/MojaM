import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translate/translation.service';

@Pipe({
  name: 'gmessage',
  standalone: false,
})
export class GmessagePipe implements PipeTransform {
  public constructor(private _translationService: TranslationService) {}

  public transform(value: string, args?: string[] | Record<string, unknown>): string {
    return this._translationService.get(value, args);
  }
}
