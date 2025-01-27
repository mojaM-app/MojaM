import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from '../storage/localstorage.service';

@Injectable({
  providedIn: 'root',
})
export class FontSizeService {
  public static readonly DefaultFontSize: number = 100;
  private static readonly StorageKey = 'fon-size';
  private static readonly AllowedFontSizes: number[] = [80, 90, 100, 110, 120, 130, 140, 150];

  private _currentFontSize = FontSizeService.DefaultFontSize;
  private readonly _renderer: Renderer2;
  private readonly _fontSizeChanged = new BehaviorSubject<number>(FontSizeService.DefaultFontSize);

  public constructor(
    private _localStorageService: LocalStorageService,
    rendererFactory: RendererFactory2
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);

    this._currentFontSize =
      this._localStorageService.loadNumber(FontSizeService.StorageKey) ??
      FontSizeService.DefaultFontSize;

    if (!this.isValidFontSize(this._currentFontSize)) {
      this._currentFontSize = FontSizeService.DefaultFontSize;
      this._localStorageService.saveNumber(FontSizeService.StorageKey, this._currentFontSize);
    }

    this.setFontSize(this._currentFontSize);
  }

  public onFontSizeChanged$(): Observable<number> {
    return this._fontSizeChanged.asObservable();
  }

  public getCurrentFontSize(): number {
    return this._currentFontSize;
  }

  public setFontSize(fontSize: number): void {
    const fontSizePrefix = 'fs-';

    FontSizeService.AllowedFontSizes.forEach(fs => {
      this._renderer.removeClass(document.body, fontSizePrefix + fs);
    });

    if (this.isValidFontSize(fontSize)) {
      this._currentFontSize = fontSize;
      this._localStorageService.saveNumber(FontSizeService.StorageKey, this._currentFontSize);
      this._renderer.addClass(document.body, `fs-${this._currentFontSize}`);
      this._fontSizeChanged.next(this._currentFontSize);
    }
  }

  private isValidFontSize(fontSize: number | null | undefined): boolean {
    return (
      (fontSize ?? 0) > 0 &&
      FontSizeService.AllowedFontSizes.findIndex(fs => fs === fontSize) !== -1
    );
  }
}
