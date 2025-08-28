import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';
import { TranslationService } from '../translate/translation.service';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  public constructor(
    private readonly _translationService: TranslationService,
    private readonly _swUpdate: SwUpdate
  ) {
    if (_swUpdate.isEnabled) {
      // Sprawdzaj aktualizacje co 30 sekund
      interval(30000).subscribe(() => _swUpdate.checkForUpdate());

      // Nasłuchuj dostępnych aktualizacji
      _swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm(_translationService.get('SwUpdate/NewVersionAvailable'))) {
            this.updateApp();
          }
        }
      });
    }
  }

  // Metoda do wymuszenia sprawdzenia aktualizacji
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
