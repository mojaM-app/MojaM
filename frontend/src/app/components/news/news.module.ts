import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NewsHeaderComponent } from './header/header.component';
import { NewsRoutingModule } from './news-routing.module';

@NgModule({
  declarations: [NewsHeaderComponent],
  imports: [
    CommonModule,
    NewsRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
  ],
  exports: [NewsHeaderComponent],
})
export class NewsModule {}
