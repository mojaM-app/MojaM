import { Injectable } from '@angular/core';
import * as Globalize from 'globalize';
import { LocalStorageService } from '../storage/localstorage.service';
import { CldrLocaleService } from './cldr-locale.service';

@Injectable({
  providedIn: 'root',
})
export class CultureService {
  public static readonly DefaultCulture = 'pl';

  public currentCulture: string = CultureService.DefaultCulture;
  public timeFormat = 'HH:mm';
  public dateFormat = 'dd.MM.yyyy';
  public dateTimeFormat: string = this.dateFormat + ' ' + this.timeFormat;

  private static readonly StorageKey = 'culture';

  public constructor(
    private _cldrLocaleService: CldrLocaleService,
    private _localStorageService: LocalStorageService
  ) {
    this.currentCulture =
      this._localStorageService.loadString(CultureService.StorageKey) ??
      CultureService.DefaultCulture;

    if (
      !this.currentCulture?.length ||
      !this._cldrLocaleService.getCldrLocale(this.currentCulture)
    ) {
      this.currentCulture = CultureService.DefaultCulture;
      this._localStorageService.saveString(CultureService.StorageKey, this.currentCulture);
    }
  }

  public setCultureByCldrLocale(id: string): void {
    const pack = this._cldrLocaleService.getCldrLocale(id);
    if (!pack) {
      console.error(`There is no CldrData module with id=${id}`);
      return;
    }

    this.currentCulture = id;
    this.initDateTimeFormats();
    this._localStorageService.saveString(CultureService.StorageKey, id);
  }

  public initDateTimeFormats(): void {
    const loc = Globalize.locale(this.currentCulture);
    const dateTimeFormats = loc?.main('dates/calendars/gregorian/dateTimeFormats');

    if (dateTimeFormats) {
      const availableFormats = dateTimeFormats.availableFormats;
      const d = availableFormats && availableFormats.yMd;
      const t = availableFormats && availableFormats.Hm;
      let dt = dateTimeFormats.short;
      if (d && t && dt) {
        dt = dt.replace('{0}', t).replace('{1}', d);
      }
      this.timeFormat = t;
      this.dateFormat = d;
      this.dateTimeFormat = dt;
    }
  }
}
