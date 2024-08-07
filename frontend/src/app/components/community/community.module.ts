import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DirectivesModule } from '../../../directives/directives.module';
import { PipesModule } from '../../../pipes/pipes.module';
import { CommunityRoutingModule } from './community-routing.module';
import { ContactComponent } from './contact/contact.component';
import { DiaconieComponent } from './diaconie/diaconie.component';
import { IndexComponent } from './index/index.component';
import { MeetingsComponent } from './meetings/meetings.component';
import { MissionComponent } from './mission/mission.component';
import { RegulationsComponent } from './regulations/regulations.component';
import { StructureComponent } from './structure/structure.component';

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
