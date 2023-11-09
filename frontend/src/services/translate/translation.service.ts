import * as Globalize from 'globalize';
import { LocalStorageService } from '../storage/localstorage.service';
import { Injectable } from '@angular/core';
import { Translation } from './classes/translation';
import { ILanguageData } from './interfaces/ILanguageData';
import { SupportedLanguages } from './classes/SupportedLanguages';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private static readonly StorageKey = 'lang';
  private static readonly DefaultLang = 'pl';

  public currentLang: string | null = null;

  public readonly langs: ILanguageData[] = SupportedLanguages.Get();

  public constructor(private _localStorageService: LocalStorageService) {
    this.currentLang = this._localStorageService.loadString(TranslationService.StorageKey);
    if (!this.isValidLang(this.currentLang)) {
      const browserLang = navigator.language;
      this.currentLang = this.isValidLang(browserLang) ? browserLang : TranslationService.DefaultLang;
      this._localStorageService.saveString(TranslationService.StorageKey, this.currentLang);
    }
  }

  public get(key: string, interpolateParams?: any): string {
    return this.getFormatter(key)(interpolateParams);
  }

  public getTranslation(key: string, params?: unknown | (() => unknown)): Translation {
    return Translation.FromService(this, key, params);
  }

  public getFormatter(key: string): (...args: any[]) => string {
    try {
      return Globalize(this.currentLang || TranslationService.DefaultLang).messageFormatter(key);
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
            this._localStorageService.saveString(TranslationService.StorageKey, lang);
          })
          .catch(e => {
            console.error(`There is no language module with ${lang} id`, e);
          });
      }
    }
    throw new Error('Invalid language selected');
  }

  private keyExists(key: string): boolean {
    return this.tryGetFormatter(key) != null;
  }

  private tryGetFormatter(key: string): ((...args: any[]) => string) | null {
    try {
      return Globalize(this.currentLang || TranslationService.DefaultLang).messageFormatter(key);
    } catch (ex) {
      if ((ex as any)?.code === 'E_MISSING_MESSAGE') {
        return null;
      }
      throw ex;
    }
  }

  private isValidLang(lang: string | null): boolean {
    return lang !== null && lang?.length > 0 && this.langs.findIndex(element => element.id === lang) !== -1;
  }
}
