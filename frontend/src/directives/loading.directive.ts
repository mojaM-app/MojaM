import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { GuidUtils } from 'src/utils/guid.utils';

@Directive({
  selector: '[loading]',
  standalone: false,
})
export class LoadingDirective implements OnInit, OnChanges {
  @HostBinding('style.position')
  public hostPosition = 'relative';

  @Input() public loading = false;

  public uid: string | null = null;

  public constructor(
    private _targetEl: ElementRef,
    private _renderer: Renderer2
  ) {}

  public ngOnInit(): void {
    this.uid = 'loading-container-' + GuidUtils.create();

    const loadingContainer = this._renderer.createElement('div');
    this._renderer.setStyle(loadingContainer, 'display', this.loading ? 'flex' : 'none');
    this._renderer.addClass(loadingContainer, this.uid);
    this._renderer.setStyle(loadingContainer, 'width', '100%');
    this._renderer.setStyle(loadingContainer, 'flex-direction', 'column');
    this._renderer.setStyle(loadingContainer, 'align-items', 'center');
    this._renderer.setStyle(loadingContainer, 'margin', '2rem 0');

    const spinnerContainer = this._renderer.createElement('div');
    this._renderer.addClass(spinnerContainer, 'loader');
    this._renderer.appendChild(loadingContainer, spinnerContainer);

    this._renderer.appendChild(this._targetEl.nativeElement, loadingContainer);
  }

  public ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges['loading']) {
      const container = this._targetEl.nativeElement;
      const div = container.querySelector('.' + this.uid);
      if (div) {
        this._renderer.setStyle(div, 'display', this.loading ? 'flex' : 'none');
      }
    }
  }
}
