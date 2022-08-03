import { Component } from '@angular/core';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  standalone: true,
  imports: [PipesModule]
})
export class NotFoundComponent {}
