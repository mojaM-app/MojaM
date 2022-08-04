import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InformationComponent } from './information/information.component';
import { CalendarComponent } from './calendar/calendar.component';



@NgModule({
  declarations: [
    InformationComponent,
    CalendarComponent
  ],
  imports: [
    CommonModule
  ]
})
export class NewsModule { }
