import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { DirectivesModule } from '../../../../directives/directives.module';
import { PipesModule } from '../../../../pipes/pipes.module';
import { NewsModule } from '../news.module';
import { AnnouncementsComponent } from './announcements.component';
import { AnnouncementsRoutingModule } from './announcements.routing';

@NgModule({
  declarations: [AnnouncementsComponent],
  imports: [
    CommonModule,
    AnnouncementsRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    RouterModule,
    NewsModule,
    PipesModule,
    DirectivesModule,
  ],
})
export class AnnouncementsModule {}
