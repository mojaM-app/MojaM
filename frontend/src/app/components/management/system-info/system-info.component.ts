import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { ISystemInfo } from './interfaces/system-info.interface';
import { SystemInfoService } from './services/system-info.service';

@Component({
  selector: 'app-system-info',
  imports: [
    PipesModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule,
    CardHeaderComponent,
  ],
  templateUrl: './system-info.component.html',
  styleUrl: './system-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemInfoComponent extends WithUnsubscribe() implements OnInit {
  public readonly systemInfo = signal<ISystemInfo | undefined>(undefined);
  public readonly isLoading = signal<boolean>(true);
  public readonly error = signal<string | undefined>(undefined);

  public constructor(private _systemInfoService: SystemInfoService) {
    super();
  }

  public ngOnInit(): void {
    this.loadSystemInfo();
  }

  public refresh(): void {
    this.loadSystemInfo();
  }

  public formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  public getStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
      case 'disconnected':
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  public getStatusIcon(status: string): string {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'check_circle';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
      case 'disconnected':
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  private loadSystemInfo(): void {
    this.isLoading.set(true);
    this.error.set(undefined);

    this.addSubscription(
      this._systemInfoService.get().subscribe({
        next: data => {
          this.systemInfo.set(data);
          this.isLoading.set(false);
        },
        error: err => {
          this.error.set(err?.message || 'An error occurred while loading system information');
          this.isLoading.set(false);
        },
      })
    );
  }
}
