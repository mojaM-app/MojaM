import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { NewsComponent } from './news.component';
import { InformationRoutingModule } from './news.routing';

@NgModule({
  declarations: [NewsComponent],
  imports: [
    CommonModule,
    InformationRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    RouterModule,
    PipesModule,
    DirectivesModule,
  ],
})
export class NewsModule {}
