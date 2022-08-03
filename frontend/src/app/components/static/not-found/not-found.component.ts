import { Component } from '@angular/core';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  standalone: true,
  imports: [PipesModule]
})
export class NotFoundComponent {}
