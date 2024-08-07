import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
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
  public static readonly LightThemeName = 'light';
  private static readonly DarkThemeName = 'dark';
  private static readonly StorageKey = 'theme';

  public readonly themes: ThemeData[] = [
    {
      label: 'Light',
      class: ThemeService.LightThemeName,
    },
    {
      label: 'Dark',
      class: ThemeService.DarkThemeName,
    },
  ];

  private _currentTheme: string | null = null;
  private readonly _renderer: Renderer2;
  private readonly _themChanged = new BehaviorSubject<string>(ThemeService.LightThemeName);

  public constructor(
    private _localStorageService: LocalStorageService,
    rendererFactory: RendererFactory2
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);

    this._currentTheme = this.getPrefersScheme();

    if (!this.isValidThemeName(this._currentTheme)) {
      this._currentTheme = ThemeService.LightThemeName;
      this._localStorageService.saveString(ThemeService.StorageKey, this._currentTheme);
    }

    this.setTheme(this._currentTheme);
  }

  public onThemeChanged$(): Observable<string> {
    return this._themChanged.asObservable();
  }

  public onOffDarkMode(on: boolean): void {
    const theme = on ? ThemeService.DarkThemeName : ThemeService.LightThemeName;
    this.switchTheme(theme);
  }

  public isDarkMode(): boolean {
    return this._currentTheme === ThemeService.DarkThemeName;
  }

  private switchTheme(theme: string): void {
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

  private isValidThemeName(theme: string | null | undefined): boolean {
    return (
      (theme?.length ?? 0) > 0 && this.themes.findIndex(element => element.class === theme) !== -1
    );
  }

  private setTheme(theme: string | null): void {
    const colorSchemePrefix = 'theme-';

    this.themes.forEach(dt => {
      this._renderer.removeClass(document.body, colorSchemePrefix + dt.class);
    });

    const themeName = theme ?? ThemeService.LightThemeName;
    this._renderer.addClass(document.body, colorSchemePrefix + themeName);
    this._themChanged.next(themeName);
  }

  private getPrefersScheme(): string {
    let result = this._localStorageService.loadString(ThemeService.StorageKey);

    if ((result?.length ?? 0) > 0) {
      return result!;
    }

    // Detect if prefers-color-scheme is supported
    if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
      // Set colorScheme to Dark if prefers-color-scheme is dark. Otherwise, set it to Light.
      result = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? ThemeService.DarkThemeName
        : ThemeService.LightThemeName;
    } else {
      result = ThemeService.LightThemeName;
    }

    return result;
  }
}
