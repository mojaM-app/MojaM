import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private readonly _updateInterval = 300_000;

  public constructor(private readonly _swUpdate: SwUpdate) {
    if (_swUpdate.isEnabled) {
      interval(this._updateInterval).subscribe(() => _swUpdate.checkForUpdate());

      _swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.updateApp();
        }
      });
    }
  }

  public checkForUpdate(): void {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.checkForUpdate();
    }
  }

  private updateApp(): void {
    if (this._swUpdate.isEnabled) {
      this._swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }
}
