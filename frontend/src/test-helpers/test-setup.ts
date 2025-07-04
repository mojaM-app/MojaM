import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { IS_MOBILE } from '../app/app.config';
import { LocalStorageService } from '../services/storage/localstorage.service';
import { TranslationService } from '../services/translate/translation.service';

// Mock services
export class MockLocalStorageService {
  private _storage: Record<string, string> = {};

  public saveString(key: string, value: string): void {
    this._storage[key] = value;
  }

  public loadString(key: string): string | null {
    return this._storage[key] || null;
  }

  public saveObject(key: string, object: unknown): void {
    if (object) {
      this.saveString(key, JSON.stringify(object));
    } else {
      this.removeItem(key);
    }
  }

  public loadObject(key: string): unknown {
    const data = this.loadString(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  public saveNumber(key: string, value: number | null): void {
    if (typeof value === 'number') {
      this.saveString(key, value.toString());
    } else {
      this.removeItem(key);
    }
  }

  public loadNumber(key: string): number | null {
    const data = this.loadString(key);
    return data ? Number(data) : null;
  }

  public saveDate(key: string, date: Date): void {
    if (date instanceof Date) {
      this.saveNumber(key, date.getTime());
    } else {
      this.removeItem(key);
    }
  }

  public loadDate(key: string): Date | null {
    const data = this.loadNumber(key);
    return data ? new Date(data) : null;
  }

  public isItemSet(key: string): boolean {
    return key in this._storage;
  }

  public removeItem(key: string): void {
    delete this._storage[key];
  }

  public clear(): void {
    this._storage = {};
  }
}

export class MockActivatedRoute {
  public params = of({});
  public queryParams = of({});
  public fragment = of('');
  public data = of({});
  public snapshot = {
    params: {},
    queryParams: {},
    fragment: '',
    data: {},
    url: [],
    outlet: 'primary',
    routeConfig: null,
    root: {} as any,
    parent: {} as any,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    paramMap: {
      get: (): string | null => null,
      getAll: (): string[] => [],
      has: (): boolean => false,
      keys: [],
    },
    queryParamMap: {
      get: (): string | null => null,
      getAll: (): string[] => [],
      has: (): boolean => false,
      keys: [],
    },
  };
}

export class MockMatDialogRef {
  public close(): void {
    // Mock implementation
  }
  public afterClosed(): any {
    return of(undefined);
  }
}

export class MockMatBottomSheetRef {
  public dismiss(): void {
    // Mock implementation
  }
  public afterDismissed(): any {
    return of(undefined);
  }
}

export class MockMatSnackBarRef {
  public dismiss(): void {
    // Mock implementation
  }
  public onAction(): any {
    return of({});
  }
  public afterDismissed(): any {
    return of({});
  }
}

export class MockAuthService {
  public isLoggedIn = of(false);
  public currentUser = of(null);

  public login(): any {
    return of({ success: true });
  }

  public logout(): void {
    // Mock implementation
  }

  public getUserPermissions(): any {
    return of([]);
  }
}

export class MockThemeService {
  public currentTheme = 'light';

  public setTheme(): void {
    // Mock implementation
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public toggleTheme(): void {
    // Mock implementation
  }
}

export class MockCultureService {
  public currentCulture = 'en-US';

  public setCulture(): void {
    // Mock implementation
  }

  public getCurrentCulture(): string {
    return this.currentCulture;
  }
}

export class MockDialogService {
  public openDialog(): any {
    return {
      afterClosed: () => of(undefined),
    };
  }

  public openConfirmDialog(): any {
    return of(true);
  }
}

export class MockSnackBarService {
  public openSnackBar(): void {
    // Mock implementation
  }

  public showMessage(): void {
    // Mock implementation
  }

  public showError(): void {
    // Mock implementation
  }
}

export class MockTranslationService {
  public currentLang = 'en';

  private readonly _translations: Record<string, string> = {
    'Shared/AppName': 'Test App',
    'Shared/Name': 'Test Name',
    'Community/Title': 'Community',
    'News/Title': 'News',
    'Announcements/Title': 'Announcements',
    'Bulletin/Title': 'Bulletin',
    'Calendar/Title': 'Calendar',
    'Settings/Title': 'Settings',
    'Shared/MainMenuTitle': 'Main Menu',
    'Header/Menu/Login': 'Login',
  };

  public get(key: string): string {
    return this._translations[key] || key;
  }

  public getError(errorKey: string): string {
    return this._translations[`Errors/${errorKey}`] || errorKey;
  }

  public getTranslation(key: string): any {
    return { value: this.get(key) };
  }

  public getFormatter(key: string): () => string {
    return () => this.get(key);
  }

  public switchLang(): Promise<void> {
    return Promise.resolve();
  }

  public getGlobalize(): any {
    return {}; // Mock Globalize
  }

  // Legacy methods for backward compatibility
  public translate(key: string): string {
    return this.get(key);
  }

  public getCurrentLanguage(): string {
    return this.currentLang;
  }

  public setLanguage(): void {
    // Mock implementation
  }

  public getAvailableLanguages(): string[] {
    return ['en', 'pl'];
  }
}

// Common providers for tests
export const COMMON_TEST_PROVIDERS = [
  { provide: IS_MOBILE, useValue: false },
  { provide: LocalStorageService, useClass: MockLocalStorageService },
  { provide: ActivatedRoute, useClass: MockActivatedRoute },
  { provide: TranslationService, useClass: MockTranslationService },
  { provide: MAT_DIALOG_DATA, useValue: {} },
  { provide: MatDialogRef, useClass: MockMatDialogRef },
  { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} },
  { provide: MatBottomSheetRef, useClass: MockMatBottomSheetRef },
  { provide: MatSnackBarRef, useClass: MockMatSnackBarRef },
];

// Common imports for tests
export const COMMON_TEST_IMPORTS = [HttpClientTestingModule];
