import * as Globalize from 'globalize';

import { registerLocaleData } from '@angular/common';
import { Injectable } from '@angular/core';

import localePL from '@angular/common/locales/pl';
import localePlExtra from '@angular/common/locales/extra/pl';

import { CultureService } from './culture.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationInitService {
  public constructor(
    private _translate: TranslationService,
    private _cultureService: CultureService
  ) {}

  public initializeApp(): Promise<void> {
    registerLocaleData(localePL, 'pl', localePlExtra);

    const promises = [
      fetch('./assets/cldr-data/supplemental/plurals.json').then(response => response.json()),
      fetch('./assets/cldr-data/supplemental/likelySubtags.json').then(response => response.json()),
      fetch('./assets/cldr-data/main/pl/numbers.json').then(response => response.json()),
      fetch('./assets/cldr-data/main/pl/ca-gregorian.json').then(response => response.json()),
      fetch('./assets/cldr-data/main/pl/currencies.json').then(response => response.json()),
    ];

    for (const ld of this._translate.langs) {
      if (ld.id === this._translate.currentLang) {
        promises.push(ld.messages());
        break;
      }
    }

    return Promise.all(promises).then(modules => {
      const plurals = modules[0];
      Globalize.load(plurals);

      const subTags = modules[1];
      Globalize.load(subTags);

      Globalize.load(modules[2]);
      Globalize.load(modules[3]);
      Globalize.load(modules[4]);

      const messages = modules[promises.length - 1];
      if (messages) {
        Globalize.loadMessages(messages);
      }

      Globalize.locale(this._cultureService.currentCulture || CultureService.DefaultCulture);
      this._cultureService.initDateTimeFormats();
    });
  }
}
