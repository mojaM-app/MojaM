import * as Globalize from 'globalize';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gnumber'
})
export class GnumberPipe implements PipeTransform {
  public transform(value: number, style?: string, maximumFractionDigits?: number): string | null {
    if (typeof value === 'number') {
      const options: any = {};
      if (typeof style === 'string') {
        options.style = style;
      }
      if (typeof maximumFractionDigits === 'number') {
        options.maximumFractionDigits = maximumFractionDigits;
      }
      return Globalize.numberFormatter(options)(value);
    }

    return null;
  }
}
