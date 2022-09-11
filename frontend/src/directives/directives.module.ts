import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoadingDirective } from './loading.directive';
import { TouchDirective } from './touch.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [
    LoadingDirective,
    TouchDirective,
  ],
  exports: [
    LoadingDirective,
    TouchDirective
  ],
})
export class DirectivesModule {}
