import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from '../storage/localstorage.service';

interface ThemeData {
  label: string;
  class: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public static readonly DefaultTheme = 'mat-ligh-theme';
  private static readonly DarkThemeName = 'mat-dark-theme';
  private static readonly StorageKey = 'theme';

  private _currentTheme: string | null = null;
  private readonly _themChanged = new BehaviorSubject<string>(
    ThemeService.DefaultTheme
  );

  public readonly themes: ThemeData[] = [
    {
      label: 'Ligh',
      class: ThemeService.DefaultTheme,
    },
    {
      label: 'Dark',
      class: ThemeService.DarkThemeName,
    },
  ];

  public constructor(private _localStorageService: LocalStorageService) {
    this._currentTheme = this._localStorageService.loadString(
      ThemeService.StorageKey
    );

    if (!this.isValidThemeName(this._currentTheme)) {
      this._currentTheme = ThemeService.DefaultTheme;
      this._localStorageService.saveString(
        ThemeService.StorageKey,
        this._currentTheme
      );
    }

    this.setTheme(this._currentTheme);
  }

  public onThemeChanged$(): Observable<string> {
    return this._themChanged.asObservable();
  }

  public switchTheme(theme: string): void {
    for (const dt of this.themes) {
      if (dt.class === theme) {
        this._currentTheme = theme;
        this._localStorageService.saveString(ThemeService.StorageKey, theme);
        this.setTheme(this._currentTheme);
        return;
      }
    }
    throw new Error('Invalid theme selected');
  }

  public onOffDarkMode(on: boolean): void {
    const theme = !!on ? ThemeService.DarkThemeName : ThemeService.DefaultTheme;
    this.switchTheme(theme);
  }

  public isDarkMode(): boolean {
    return this._currentTheme === ThemeService.DarkThemeName;
  }

  private isValidThemeName(theme: string | null): boolean {
    return (
      theme !== null &&
      theme.length > 0 &&
      this.themes.findIndex((element) => element.class === theme) !== -1
    );
  }

  private setTheme(theme: string | null): void {
    this._themChanged.next(theme ?? ThemeService.DefaultTheme);
  }
}
