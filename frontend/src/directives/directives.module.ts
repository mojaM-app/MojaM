import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ClickableDirective } from './clickable.directive';
import { InputChangedDirective } from './input-changed.directive';
import { LoadingDirective } from './loading.directive';
import { SwipeDirective } from './swipe.directive';
import { TapDirective } from './tap.directive';
import { PullToRefreshDirective } from './pull-to-refresh.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [
    LoadingDirective,
    SwipeDirective,
    ClickableDirective,
    TapDirective,
    InputChangedDirective,
    PullToRefreshDirective,
  ],
  exports: [
    LoadingDirective,
    SwipeDirective,
    ClickableDirective,
    TapDirective,
    InputChangedDirective,
    PullToRefreshDirective,
  ],
})
export class DirectivesModule {}
