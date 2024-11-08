import { Injectable } from '@angular/core';
import Globalize from 'globalize/dist/globalize';
import { LocalStorageService } from '../storage/localstorage.service';
import { SupportedLanguages } from './classes/SupportedLanguages';
import { Translation } from './classes/Translation';
import { ILanguageData } from './interfaces/ILanguageData';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private static readonly _storageKey = 'lang';
  private static readonly _defaultLang = 'pl';

  public currentLang: string | null = null;

  public readonly langs: ILanguageData[] = SupportedLanguages.Get();

  public constructor(private _localStorageService: LocalStorageService) {
    this.currentLang = this._localStorageService.loadString(TranslationService._storageKey);
    if (!this.isValidLang(this.currentLang)) {
      const browserLang = navigator.language;
      this.currentLang = this.isValidLang(browserLang)
        ? browserLang
        : TranslationService._defaultLang;
      this._localStorageService.saveString(TranslationService._storageKey, this.currentLang);
    }
  }

  public get(key: string, interpolateParams?: unknown): string {
    return this.getFormatter(key)(interpolateParams);
  }

  public getError(errorKey: string, interpolateParams?: unknown): string {
    return this.getFormatter(`Errors/${errorKey}`)(interpolateParams);
  }

  public getTranslation(key: string, params?: unknown | (() => unknown)): Translation {
    return Translation.FromService(this, key, params);
  }

  public getFormatter(key: string): (...args: any[]) => string {
    try {
      return this.getGlobalize().messageFormatter(key);
    } catch (ex) {
      if ((ex as any)?.code === 'E_MISSING_MESSAGE') {
        return () => {
          let keyName = (Globalize as any)._alwaysArray(key)[0];
          keyName = keyName.slice(keyName.lastIndexOf('/') + 1);
          keyName = keyName.replace(/-/g, ' ');
          keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
          return keyName;
        };
      }
      console.error('Translation error for key: ' + key, ex);
      return () => key;
    }
  }

  public switchLang(lang: string): Promise<void> {
    for (const ld of this.langs) {
      if (ld.id === lang) {
        return ld
          .messages()
          .then(messages => {
            Globalize.loadMessages(messages);
            this._localStorageService.saveString(TranslationService._storageKey, lang);
          })
          .catch(e => {
            console.error(`There is no language module with ${lang} id`, e);
          });
      }
    }
    throw new Error('Invalid language selected');
  }

  public getGlobalize(): Globalize {
    return Globalize(this.currentLang || TranslationService._defaultLang);
  }

  private isValidLang(lang: string | null | undefined): boolean {
    return (lang?.length ?? 0) > 0 && this.langs.findIndex(element => element.id === lang) !== -1;
  }
}
