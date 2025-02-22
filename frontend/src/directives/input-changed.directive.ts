import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import { debounceTime, fromEvent } from 'rxjs';

@Directive({
  selector: '[inputChanged]',
  standalone: false,
})
export class InputChangedDirective {
  @Output() public inputChanged = new EventEmitter<string>();

  public constructor(el: ElementRef) {
    fromEvent(el.nativeElement, 'input')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        this.inputChanged.emit(el.nativeElement.value);
      });
  }
}
