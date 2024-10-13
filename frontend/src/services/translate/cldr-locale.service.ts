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
  public constructor(private readonly data: CldrPackData) {}

  public get langId(): string {
    return this.data.langId;
  }

  public get cldrDataId(): string {
    return this.data.cldrDataId;
  }

  public cldrDataLanguagesJson(): Promise<unknown> {
    return fetch(this.data.cldrDataLanguagesJson).then(response => response.json());
  }
}

@Injectable({
  providedIn: 'root',
})
export class CldrLocaleService {
  private cldrLocaleIds: string[];
  private cldrLocaleDict: Record<string, CldrPack>;

  public constructor() {
    this.cldrLocaleIds = [];
    this.cldrLocaleDict = {};
    for (const data of this.getAvailableLocales()) {
      this.cldrLocaleIds.push(data.langId);
      this.cldrLocaleDict[data.langId] = new CldrPackAdapter(data);
    }
  }

  public getCldrLocale(langId: string): CldrPack {
    return this.cldrLocaleDict[langId];
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
