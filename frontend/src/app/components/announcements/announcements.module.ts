import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsRoutingModule } from './announcements.routing';
import { CurrentAnnouncementsComponent } from './current-announcements.component';
import { AnnouncementItemListComponent } from './preview-announcements/announcement-item-list/announcement-item-list.component';
import { AnnouncementsPublishInfoComponent } from './preview-announcements/announcements-publish-info/announcements-publish-info.component';

@NgModule({
  declarations: [CurrentAnnouncementsComponent],
  imports: [
    CommonModule,
    AnnouncementsRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    PipesModule,
    DirectivesModule,
    AnnouncementItemListComponent,
    AnnouncementsPublishInfoComponent,
  ],
})
export class AnnouncementsModule {}
