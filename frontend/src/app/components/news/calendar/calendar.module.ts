import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { CalendarComponent } from './calendar.component';
import { CalendarRoutingModule } from './calendar.routing';
import { NewsModule } from '../news.module';

@NgModule({
  declarations: [CalendarComponent],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    RouterModule,
    NewsModule
  ],
})
export class CalendarModule {}
