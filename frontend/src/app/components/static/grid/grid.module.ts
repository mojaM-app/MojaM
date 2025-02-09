import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { CardHeaderComponent } from '../card-header/card-header.component';
import { DetailsDirective } from './directive/details.directive';
import { GridComponent } from './grid/grid.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    GridComponent,
    CardHeaderComponent,
    DetailsDirective,
    PipesModule,
    DirectivesModule,
  ],
  exports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    GridComponent,
    CardHeaderComponent,
    DetailsDirective,
    PipesModule,
    DirectivesModule,
  ],
})
export class GridModule {}
