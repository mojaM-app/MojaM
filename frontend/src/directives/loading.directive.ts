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
    private targetEl: ElementRef,
    private renderer: Renderer2
  ) {}

  public ngOnInit(): void {
    this.uid = 'loading-container-' + GuidUtils.create();

    const loadingContainer = this.renderer.createElement('div');
    this.renderer.setStyle(loadingContainer, 'display', this.loading ? 'flex' : 'none');
    this.renderer.addClass(loadingContainer, this.uid);
    this.renderer.setStyle(loadingContainer, 'width', '100%');
    this.renderer.setStyle(loadingContainer, 'flex-direction', 'column');
    this.renderer.setStyle(loadingContainer, 'align-items', 'center');
    this.renderer.setStyle(loadingContainer, 'margin', '2rem 0');

    const spinnerContainer = this.renderer.createElement('div');
    this.renderer.addClass(spinnerContainer, 'loader');
    this.renderer.appendChild(loadingContainer, spinnerContainer);

    this.renderer.appendChild(this.targetEl.nativeElement, loadingContainer);
  }

  public ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges['loading']) {
      const container = this.targetEl.nativeElement;
      const div = container.querySelector('.' + this.uid);
      if (div) {
        this.renderer.setStyle(div, 'display', this.loading ? 'flex' : 'none');
      }
    }
  }
}
