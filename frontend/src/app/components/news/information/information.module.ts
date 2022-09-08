import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { InformationRoutingModule } from './information.routing';
import { InformationComponent } from './information.component';
import { NewsModule } from '../news.module';

@NgModule({
  declarations: [InformationComponent],
  imports: [
    CommonModule,
    InformationRoutingModule,
    MatToolbarModule,
    MatTabsModule,
    RouterModule,
    NewsModule
  ],
})
export class InformationModule {}
