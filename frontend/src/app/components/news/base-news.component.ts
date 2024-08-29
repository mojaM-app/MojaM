import { Component, ViewChild } from '@angular/core';
import { NewsHeaderComponent } from './header/header.component';

@Component({
  template: '',
})
export abstract class BaseNewsComponent {
  @ViewChild('header')
  private _header: NewsHeaderComponent | undefined = undefined;

  public selectNextTab(): void {
    this._header?.setNextTab();
  }

  public selectPrevTab(): void {
    this._header?.setPrevTab();
  }
}
