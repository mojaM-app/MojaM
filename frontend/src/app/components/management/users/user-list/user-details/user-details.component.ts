import { Component, input } from '@angular/core';
import { IUserGridItemDto } from 'src/interfaces/users/users.interfaces';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [PipesModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent {
  public user = input<IUserGridItemDto>();
}
