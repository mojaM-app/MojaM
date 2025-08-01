import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, fromEvent, interval, Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly _updateAvailable$ = new BehaviorSubject<boolean>(false);
  private readonly _updateActivated$ = new BehaviorSubject<boolean>(false);

  public constructor(private readonly _swUpdate: SwUpdate) {
    if (this._swUpdate.isEnabled) {
      this.initializeUpdateCheck();
    }
  }

  public get updateAvailable(): Observable<boolean> {
    return this._updateAvailable$.asObservable();
  }

  public get updateActivated(): Observable<boolean> {
    return this._updateActivated$.asObservable();
  }

  public async checkForUpdate(): Promise<boolean> {
    if (!this._swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this._swUpdate.checkForUpdate();
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  public async activateUpdate(): Promise<boolean> {
    if (!this._swUpdate.isEnabled) {
      return false;
    }

    try {
      await this._swUpdate.activateUpdate();
      this._updateActivated$.next(true);
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error activating update:', error);
      return false;
    }
  }

  private initializeUpdateCheck(): void {
    // Check for updates when the app starts
    this._swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_DETECTED'))
      .subscribe(() => {
        console.log('New version detected');
      });

    // Check for updates when available
    this._swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        console.log('New version ready');
        this._updateAvailable$.next(true);
      });

    // Handle activation events
    this._swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_INSTALLATION_FAILED'))
      .subscribe(evt => {
        console.error('Version installation failed:', evt.error);
      });

    // Check for updates periodically (every 6 hours)
    interval(6 * 60 * 60 * 1000)
      .pipe(
        switchMap(() => this._swUpdate.checkForUpdate()),
        filter(updateAvailable => updateAvailable)
      )
      .subscribe(() => {
        console.log('Periodic update check found new version');
      });

    // Check for updates when the app becomes visible again
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => !document.hidden),
        switchMap(() => this._swUpdate.checkForUpdate()),
        filter(updateAvailable => updateAvailable),
        take(1)
      )
      .subscribe(() => {
        console.log('Update available after visibility change');
      });
  }
}
