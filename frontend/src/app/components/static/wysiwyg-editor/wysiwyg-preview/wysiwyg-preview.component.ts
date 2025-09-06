import { ChangeDetectionStrategy, Component, input, ElementRef, computed } from '@angular/core';
import { SnackBarService } from '../../snackbar/snack-bar.service';
import { WysiwygUtils } from '../wysiwyg.utils';

@Component({
  selector: 'app-wysiwyg-preview',
  imports: [],
  templateUrl: './wysiwyg-preview.component.html',
  styleUrl: './wysiwyg-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygPreviewComponent {
  public readonly content = input.required<string>();
  protected readonly displayedContent = computed(() => {
    return WysiwygUtils.fixConjunctions(WysiwygUtils.clearContent(this.content()));
  });

  private _longPressTimer: number | null = null;

  public constructor(
    private readonly _elementRef: ElementRef,
    private readonly _snackBarService: SnackBarService
  ) {}

  protected onMouseDown(): void {
    this.startLongPress();
  }

  protected onMouseUp(): void {
    this.cancelLongPress();
  }

  protected onMouseLeave(): void {
    this.cancelLongPress();
  }

  protected onTouchStart(): void {
    this.startLongPress();
  }

  protected onTouchEnd(): void {
    this.cancelLongPress();
  }

  protected onTouchMove(): void {
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
    const element = this._elementRef.nativeElement.querySelector('.ql-editor-preview');
    const text = (element?.textContent || element?.innerText || '').trim();

    if (text) {
      await navigator.clipboard.writeText(text);
      this._snackBarService.translateAndShowSuccess({
        message: 'WysiwygEditor/CopySuccess',
        options: {
          duration: 3000,
        },
      });
    }

    this.cancelLongPress();
  }
}
