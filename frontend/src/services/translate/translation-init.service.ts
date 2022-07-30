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
    private _cultureService: CultureService,
  ) {}

  initializeApp(): Promise<void> {
    registerLocaleData(localePL, 'pl', localePlExtra);

    const promisses = [
      fetch('/assets/cldr-data/supplemental/plurals.json').then((response) =>
        response.json()
      ),
      fetch('/assets/cldr-data/supplemental/likelySubtags.json').then(
        (response) => response.json()
      ),
    ];

    for (const dt of this._translate.langs) {
      if (dt.id === this._translate.currentLang) {
        promisses.push(dt.messages());
        break;
      }
    }

    return Promise.all(promisses).then((modules) => {
      const plurals = modules[0];
      Globalize.load(plurals);

      const subtags = modules[1];
      Globalize.load(subtags);

      const messages = modules[promisses.length - 1];
      if (messages) {
        Globalize.loadMessages(messages);
      }

      Globalize.locale(
        this._cultureService.currentCulture || CultureService.DefaultCulture
      );
      this._cultureService.initDateTimeFormats();
    });
  }
}
