import { Injectable } from '@angular/core';
import { BehaviorSubject, MonoTypeOperatorFunction, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private readonly _isBusy = new BehaviorSubject<boolean>(false);
  private _waitCounter = 0;
  private _showSpinnerTimeout: NodeJS.Timeout | null = null;
  private _hideSpinnerTimeout: NodeJS.Timeout | null = null;

  public onStateChanged$(): Observable<boolean> {
    return this._isBusy.asObservable();
  }

  public showSpinner(): void {
    this._isBusy.next(true);
  }

  public hideSpinner(): void {
    this._isBusy.next(false);
  }

  public isLoading(): boolean {
    return this._isBusy.value;
  }

  public waitForSubscription<T>(): MonoTypeOperatorFunction<T> {
    this.incrementWait();
    return tap({
      error: () => this.decrementWait(),
      complete: () => this.decrementWait(),
    });
  }

  private decrementWait(): void {
    if (--this._waitCounter === 0) {
      if (this._hideSpinnerTimeout) {
        window.clearTimeout(this._hideSpinnerTimeout);
      }
      this._hideSpinnerTimeout = setTimeout(() => this.hideSpinner(), 100);

      if (this._showSpinnerTimeout) {
        window.clearTimeout(this._showSpinnerTimeout);
      }
      this._showSpinnerTimeout = null;
    }
  }

  private incrementWait(): void {
    ++this._waitCounter;
    if (this._hideSpinnerTimeout) {
      window.clearTimeout(this._hideSpinnerTimeout);
    }
    this._hideSpinnerTimeout = null;

    if (this._showSpinnerTimeout) {
      window.clearTimeout(this._showSpinnerTimeout);
    }
    this._showSpinnerTimeout = setTimeout(() => this.showSpinner(), 200);
  }
}
