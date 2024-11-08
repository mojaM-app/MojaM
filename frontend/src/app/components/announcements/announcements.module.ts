import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsRoutingModule } from './announcements.routing';
import { CurrentAnnouncementsComponent } from './current-announcements.component';

@NgModule({
  declarations: [CurrentAnnouncementsComponent],
  imports: [
    CommonModule,
    AnnouncementsRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    RouterModule,
    PipesModule,
    DirectivesModule,
  ],
})
export class AnnouncementsModule {}
