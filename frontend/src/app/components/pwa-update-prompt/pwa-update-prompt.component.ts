import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { PwaUpdateService } from 'src/services/pwa/pwa-update.service';

@Component({
  selector: 'app-pwa-update-prompt',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './pwa-update-prompt.component.html',
  styleUrl: './pwa-update-prompt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaUpdatePromptComponent implements OnInit, OnDestroy {
  public showUpdatePrompt = false;

  private readonly _pwaUpdateService = inject(PwaUpdateService);
  private readonly _destroy$ = new Subject<void>();

  public ngOnInit(): void {
    this._pwaUpdateService.updateAvailable
      .pipe(takeUntil(this._destroy$))
      .subscribe(updateAvailable => {
        this.showUpdatePrompt = updateAvailable;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public async onUpdateClick(): Promise<void> {
    await this._pwaUpdateService.activateUpdate();
    this.showUpdatePrompt = false;
  }

  public onDismiss(): void {
    this.showUpdatePrompt = false;
  }
}
