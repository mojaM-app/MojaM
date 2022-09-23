import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PipesModule } from 'src/pipes/pipes.module';
import { CommunityRoutingModule } from './community-routing.module';
import { IndexComponent } from './index/index.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MeetingsComponent } from './meetings/meetings.component';
import { MissionComponent } from './mission/mission.component';
import { DiaconieComponent } from './diaconie/diaconie.component';
import { StructureComponent } from './structure/structure.component';
import { ContactComponent } from './contact/contact.component';
import { DirectivesModule } from 'src/directives/directives.module';
import { RegulationsComponent } from './regulations/regulations.component';

@NgModule({
  declarations: [
    IndexComponent,
    MeetingsComponent,
    MissionComponent,
    DiaconieComponent,
    StructureComponent,
    ContactComponent,
    RegulationsComponent,
  ],
  imports: [
    CommonModule,
    CommunityRoutingModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    PipesModule,
    DirectivesModule,
  ],
})
export class CommunityModule {}
