import { registerLocaleData } from '@angular/common';
import { Injectable } from '@angular/core';
import * as Globalize from 'globalize';

import localePlExtra from '@angular/common/locales/extra/pl';
import localePL from '@angular/common/locales/pl';

import { CultureService } from './culture.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationInitService {
  public constructor(
    private _translationService: TranslationService,
    private _cultureService: CultureService
  ) {
  }

  public initializeApp(): Promise<void> {
    const locales = this.getSupportedLocales();
    locales.forEach(locale => {
      registerLocaleData(locale.data, locale.localeId, locale.extraData);
    });

    const settingsToLoad: Promise<Response>[] = [
      fetch(`./assets/cldr-data/supplemental/plurals.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/supplemental/likelySubtags.json`).then(response => response.json())
    ];

    const resourcesToLoad: Promise<Response>[] = [
      fetch(`./assets/cldr-data/supplemental/currencyData.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/supplemental/weekData.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/supplemental/languageData.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/supplemental/timeData.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/main/pl/numbers.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/main/pl/currencies.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/main/pl/ca-gregorian.json`).then(response => response.json()),
      fetch(`./assets/cldr-data/main/pl/timeZoneNames.json`).then(response =>
        response.json()
      ),
      fetch(`./assets/cldr-data/main/pl/dateFields.json`).then(response => response.json())
    ];

    const messagesToLoad: Promise<Record<string, unknown>>[] = [];
    for (const lang of this._translationService.langs) {
      if (lang.id === this._translationService.currentLang) {
        messagesToLoad.push(lang.messages());
        break;
      }
    }

    return Promise.all(settingsToLoad)
      .then(settings => {
        settings.forEach(setting => {
          Globalize.load(setting);
        });
      })
      .then(async () => {
        await Promise.all(messagesToLoad).then(messages => {
          messages.forEach(message => {
            Globalize.loadMessages(message);
          });
        });
      })
      .then(async () => {
        await Promise.all(resourcesToLoad).then(resources => {
          resources.forEach(resource => {
            Globalize.load(resource);
          });
        });
      })
      .then(() => {
        Globalize.locale(this.getCurrentCulture());
        this._cultureService.initDateTimeFormats();
      });
  }

  private getSupportedLocales(): { data: unknown; localeId: string; extraData: unknown }[] {
    return [
      { data: localePL, localeId: 'pl', extraData: localePlExtra },
    ];
  }

  private getCurrentCulture(): string {
    return this._cultureService.currentCulture || CultureService.DefaultCulture;
  }
}
