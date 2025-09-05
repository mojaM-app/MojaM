import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinRoutingModule } from './bulletin.routing';
import { BulletinViewsComponent } from './bulletin-views/bulletin-views.component';
import { BulletinViewsHeaderComponent } from './bulletin-views/bulletin-views-header/bulletin-views-header.component';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { BulletinViewsCalendarComponent } from './bulletin-views/bulletin-views-calendar/bulletin-views-calendar.component';
import { DateAdapter, CalendarModule as ngCalendarModule } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

@NgModule({
  declarations: [BulletinViewsComponent],
  imports: [
    CommonModule,
    BulletinRoutingModule,
    BulletinViewsHeaderComponent,
    BulletinViewsCalendarComponent,
    MatButtonModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    PipesModule,
    DirectivesModule,
    ngCalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
})
export class BulletinModule {}
