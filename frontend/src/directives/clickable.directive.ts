import { Directive, ElementRef, OnDestroy, Renderer2, inject, output } from '@angular/core';

@Directive({
  selector: '[clickable]',
})
export class ClickableDirective implements OnDestroy {
  public itemClick = output<PointerEvent | KeyboardEvent>();

  private _elementRef = inject(ElementRef);
  private _renderer = inject(Renderer2);

  private _clickMouseRef: (() => void) | null = null;
  private _clickKeyboardRef: (() => void) | null = null;

  private get elRef(): ElementRef {
    return this._elementRef.nativeElement.children[0] ?? this._elementRef.nativeElement;
  }

  public constructor() {
    this.addClickableEffect();
  }

  public ngOnDestroy(): void {
    this.removeClickableEffect();
  }

  private addClickableEffect(): void {
    this._renderer.addClass(this.elRef, 'clickable');

    this._renderer.setAttribute(this.elRef, 'tabIndex', '0');

    this._clickMouseRef = this._renderer.listen(this.elRef, 'click', (event: PointerEvent) => {
      this.itemClick.emit(event);
    });

    this._clickKeyboardRef = this._renderer.listen(
      this.elRef,
      'keydown.enter',
      (event: KeyboardEvent) => {
        this.itemClick.emit(event);
      }
    );
  }

  private removeClickableEffect(): void {
    this._renderer.removeClass(this.elRef, 'clickable');
    this._renderer.removeAttribute(this.elRef, 'tabIndex');

    if (this._clickMouseRef) {
      this._clickMouseRef();
    }

    if (this._clickKeyboardRef) {
      this._clickKeyboardRef();
    }
  }
}