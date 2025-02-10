import { Component, effect, input } from '@angular/core';
import { IUserPermissions } from '../interfaces/user-permissions.interface';

@Component({
  selector: 'app-permissions-tree',
  imports: [],
  templateUrl: './permissions-tree.component.html',
  styleUrl: './permissions-tree.component.scss',
})
export class PermissionsTreeComponent {
  public readonly user = input.required<IUserPermissions>();
  public constructor() {
    effect(() => {
      console.log(this.user());
    });
  }
}
