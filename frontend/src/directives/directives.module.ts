import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoadingDirective } from './loading.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [
    LoadingDirective,
  ],
  exports: [
    LoadingDirective,
  ],
})
export class DirectivesModule {}
