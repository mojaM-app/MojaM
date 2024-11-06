import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ClickableDirective } from './clickable.directive';
import { LoadingDirective } from './loading.directive';
import { SwipeDirective } from './swipe.directive';
import { TapDirective } from './tap.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [LoadingDirective, SwipeDirective, ClickableDirective, TapDirective],
  exports: [LoadingDirective, SwipeDirective, ClickableDirective, TapDirective],
})
export class DirectivesModule {}
