import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/directives/directives.module';
import { PipesModule } from 'src/pipes/pipes.module';
import { DetailsDirective } from './directive/details.directive';
import { GridToolbarComponent } from './grid/grid-toolbar/grid-toolbar.component';
import { GridComponent } from './grid/grid.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    GridComponent,
    GridToolbarComponent,
    DetailsDirective,
    PipesModule,
    DirectivesModule,
  ],
  exports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    GridComponent,
    GridToolbarComponent,
    DetailsDirective,
    PipesModule,
    DirectivesModule,
  ],
})
export class GridModule {}
