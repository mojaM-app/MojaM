import { ILanguageData } from '../interfaces/ILanguageData';

export class SupportedLanguages {
  private static _supportedLanguages: ILanguageData[] | null = null;

  static Get(): ILanguageData[] {
    if (this._supportedLanguages === null) {
      this._supportedLanguages = [
        {
          id: 'pl',
          label: 'język polski',
          icon: 'svg/languages/pl.svg',
          messages: () =>
            fetch(`./i18n/pl.json?${new Date().getTime()}`)
              .then(response => response.json())
              .then(messages => ({ pl: messages })),
        } satisfies ILanguageData,
      ];
    }

    return this._supportedLanguages;
  }
}
