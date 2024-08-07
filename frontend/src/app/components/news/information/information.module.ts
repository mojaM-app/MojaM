import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { DirectivesModule } from '../../../../directives/directives.module';
import { PipesModule } from '../../../../pipes/pipes.module';
import { NewsModule } from '../news.module';
import { InformationComponent } from './information.component';
import { InformationRoutingModule } from './information.routing';

@NgModule({
  declarations: [InformationComponent],
  imports: [
    CommonModule,
    InformationRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    RouterModule,
    NewsModule,
    PipesModule,
    DirectivesModule,
  ],
})
export class InformationModule {}
