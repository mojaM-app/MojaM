import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsRoutingModule } from './news-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NewsHeaderComponent } from './header/header.component';

@NgModule({
  declarations: [NewsHeaderComponent],
  imports: [CommonModule, NewsRoutingModule, MatToolbarModule, MatTabsModule, RouterModule, MatTabsModule],
  exports: [NewsHeaderComponent],
})
export class NewsModule {}
