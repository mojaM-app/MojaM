import { Component, ViewChild } from '@angular/core';
import { NewsHeaderComponent } from './header/header.component';

@Component({
  template: '',
})
export abstract class BaseNewsComponent {
  @ViewChild('header')
  public header: NewsHeaderComponent | null = null;

  public selectNextTab(): void {
    this.header?.setNextTab();
  }

  public selectPrevTab(): void {
    this.header?.setPrevTab();
  }
}
