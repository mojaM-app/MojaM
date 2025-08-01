import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PwaInstallService } from 'src/services/pwa/pwa-install.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './pwa-install-prompt.component.html',
  styleUrl: './pwa-install-prompt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallPromptComponent implements OnInit, OnDestroy {
  public showAndroidPrompt = false;
  public showIOSInstructions = false;

  private readonly _pwaInstallService = inject(PwaInstallService);
  private readonly _destroy$ = new Subject<void>();

  public ngOnInit(): void {
    // Show Android/Chrome install prompt
    this._pwaInstallService.shouldShowInstallPrompt
      .pipe(takeUntil(this._destroy$))
      .subscribe(shouldShow => {
        this.showAndroidPrompt = shouldShow;
      });

    // Show iOS Safari instructions
    if (this._pwaInstallService.shouldShowIOSInstructions()) {
      this.showIOSInstructions = true;
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public async onInstallClick(): Promise<void> {
    const installed = await this._pwaInstallService.promptInstall();
    if (installed) {
      this.showAndroidPrompt = false;
    }
  }

  public onDismiss(): void {
    this.showAndroidPrompt = false;
    this.showIOSInstructions = false;
    this._pwaInstallService.dismissInstallPrompt();
  }
}
