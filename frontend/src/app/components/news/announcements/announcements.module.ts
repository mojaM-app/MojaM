import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { AnnouncementsRoutingModule } from './announcements.routing';
import { AnnouncementsComponent } from './announcements.component';
import { NewsModule } from '../news.module';

@NgModule({
  declarations: [AnnouncementsComponent],
  imports: [
    CommonModule,
    AnnouncementsRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    RouterModule,
    NewsModule
  ],
})
export class AnnouncementsModule {}
