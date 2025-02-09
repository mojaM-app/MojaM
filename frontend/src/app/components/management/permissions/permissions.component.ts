import { Component } from '@angular/core';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { IUserPermissions } from './interfaces/user-permissions.interface';
import { PermissionsService } from './services/permissions.service';

@Component({
  selector: 'app-permissions',
  imports: [CardHeaderComponent],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent extends WithUnsubscribe() {
  public constructor(private _permissionsService: PermissionsService) {
    super();
  }

  public ngOnInit(): void {
    this.addSubscription(
      this._permissionsService.get().subscribe((response: IUserPermissions[]) => {
        console.log(response);
      })
    );
  }
}
