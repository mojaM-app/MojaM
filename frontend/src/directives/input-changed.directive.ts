import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import { debounceTime, fromEvent } from 'rxjs';

@Directive({
  selector: '[inputChanged]',
  standalone: false,
})
export class InputChangedDirective {
  @Output() inputChanged = new EventEmitter<string>();

  constructor(private el: ElementRef) {
    fromEvent(this.el.nativeElement, 'input')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        this.inputChanged.emit(this.el.nativeElement.value);
      });
  }
}
