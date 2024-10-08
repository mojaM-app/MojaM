import { Injectable } from '@angular/core';

interface CldrPack {
  langId: string;
  cldrDataId: string;
  cldrDataLanguagesJson(): Promise<any>;
}

interface CldrPackData {
  langId: string;
  cldrDataId: string;
  cldrDataLanguagesJson: string;
}

class CldrPackAdapter implements CldrPack {
  constructor(private readonly data: CldrPackData) {}

  get langId(): string {
    return this.data.langId;
  }

  get cldrDataId(): string {
    return this.data.cldrDataId;
  }

  public cldrDataLanguagesJson(): Promise<any> {
    return fetch(this.data.cldrDataLanguagesJson).then(response => response.json());
  }
}

@Injectable({
  providedIn: 'root',
})
export class CldrLocaleService {
  private cldrLocaleIds: string[];
  private cldrLocaleDict: Record<string, CldrPack>;

  constructor() {
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
