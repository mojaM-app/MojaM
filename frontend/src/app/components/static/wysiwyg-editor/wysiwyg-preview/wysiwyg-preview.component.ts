import { ChangeDetectionStrategy, Component, input, ElementRef } from '@angular/core';
import { SnackBarService } from '../../snackbar/snack-bar.service';

@Component({
  selector: 'app-wysiwyg-preview',
  imports: [],
  templateUrl: './wysiwyg-preview.component.html',
  styleUrl: './wysiwyg-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygPreviewComponent {
  public readonly content = input.required<string>();

  private _longPressTimer: number | null = null;

  public constructor(private readonly _snackBarService: SnackBarService) {}

  protected onMouseDown(): void {
    this.startLongPress();
  }

  protected onMouseUp(): void {
    this.cancelLongPress();
  }

  protected onMouseLeave(): void {
    this.cancelLongPress();
  }

  protected onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.startLongPress();
  }

  protected onTouchEnd(): void {
    this.cancelLongPress();
  }

  private startLongPress(): void {
    this._longPressTimer = window.setTimeout(() => {
      this.copyToClipboard();
    }, 5000);
  }

  private cancelLongPress(): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }

  private async copyToClipboard(): Promise<void> {
    const text = this.content()?.trim();

    if (text?.length > 0) {
      await navigator.clipboard.writeText(text);
      this._snackBarService.translateAndShowSuccess({
        message: 'WysiwygEditor/CopySuccess',
      });
    }

    this.cancelLongPress();
  }
}
