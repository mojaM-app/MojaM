import { DateUtils } from 'src/utils/date.utils';
import { ILanguageData } from '../interfaces/ILanguageData';

export class SupportedLanguages {
  private static _supportedLanguages: ILanguageData[] | null = null;

  public static Get(): ILanguageData[] {
    if (this._supportedLanguages === null) {
      this._supportedLanguages = [
        {
          id: 'pl',
          label: 'język polski',
          icon: 'svg/languages/pl.svg',
          messages: (): Promise<Record<string, unknown>> =>
            fetch(`./i18n/pl.json?${DateUtils.toDateString(new Date())}`)
              .then(response => response.json())
              .then(messages => ({ pl: messages })),
        } satisfies ILanguageData,
      ];
    }

    return this._supportedLanguages;
  }
}
