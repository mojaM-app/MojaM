import { Injectable } from '@angular/core';

interface CldrPack {
  langId: string;
  cldrDataId: string;
  cldrDataLanguagesJson(): Promise<unknown>;
}

interface CldrPackData {
  langId: string;
  cldrDataId: string;
  cldrDataLanguagesJson: string;
}

class CldrPackAdapter implements CldrPack {
  public constructor(private readonly _data: CldrPackData) {}

  public get langId(): string {
    return this._data.langId;
  }

  public get cldrDataId(): string {
    return this._data.cldrDataId;
  }

  public cldrDataLanguagesJson(): Promise<unknown> {
    return fetch(this._data.cldrDataLanguagesJson).then(response => response.json());
  }
}

@Injectable({
  providedIn: 'root',
})
export class CldrLocaleService {
  private _cldrLocaleIds: string[];
  private _cldrLocaleDict: Record<string, CldrPack>;

  public constructor() {
    this._cldrLocaleIds = [];
    this._cldrLocaleDict = {};
    for (const data of this.getAvailableLocales()) {
      this._cldrLocaleIds.push(data.langId);
      this._cldrLocaleDict[data.langId] = new CldrPackAdapter(data);
    }
  }

  public getCldrLocale(langId: string): CldrPack {
    return this._cldrLocaleDict[langId];
  }

  private getAvailableLocales(): CldrPackData[] {
    return [
      {
        langId: 'pl',
        cldrDataId: 'pl',
        cldrDataLanguagesJson: '/assets/cldr-data/main/pl/languages.json',
      },
    ];
  }
}
