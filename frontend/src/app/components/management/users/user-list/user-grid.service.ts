import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { IUserGridItemDto } from 'src/app/components/management/users/user-list/interfaces/user-list.interfaces';
import { UserListService } from 'src/app/components/management/users/user-list/services/user-list.service';
import { BaseGridService } from 'src/app/components/static/grid/grid/services/base-grid.service';
import {
  COLUMN_NAMES,
  ColumnType,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/services/grid-service.interface';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IMenuItem } from 'src/interfaces/menu/menu-item';
import { MenuItemClickResult } from 'src/interfaces/menu/menu.enum';
import { PermissionService } from 'src/services/auth/permission.service';
import { DialogService } from 'src/services/dialog/dialog.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { ManagementMenuEditUser } from '../../management.menu';
import { UserListColumns } from './user-list.columns';

@Injectable({
  providedIn: 'root',
})
export class UserGridService
  extends BaseGridService
  implements IGridService<IUserGridItemDto, IGridData<IUserGridItemDto>>
{
  public constructor(
    private _listService: UserListService,
    permissionService: PermissionService,
    dialogService: DialogService,
    translationService: TranslationService,
    snackBarService: SnackBarService,
    router: Router,
    cultureService: CultureService
  ) {
    super(
      permissionService,
      dialogService,
      translationService,
      snackBarService,
      router,
      cultureService
    );
  }

  public getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<IGridData<IUserGridItemDto> | null> {
    return this._listService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }

  public getDisplayedColumns(): IGridColumn[] {
    const result: IGridColumn[] = [
      {
        propertyName: UserListColumns.firstName!,
        title: this._translationService.get('Management/UserList/GridColumns/FirstName'),
      },
      {
        propertyName: UserListColumns.lastName!,
        title: this._translationService.get('Management/UserList/GridColumns/LastName'),
      },
      {
        propertyName: UserListColumns.email,
        title: this._translationService.get('Management/UserList/GridColumns/Email'),
        mediaMinWidth: 460,
      },
      {
        propertyName: UserListColumns.phone,
        title: this._translationService.get('Management/UserList/GridColumns/Phone'),
        mediaMinWidth: 560,
      },
      {
        propertyName: UserListColumns.isLockedOut,
        title: this._translationService.get('Management/UserList/GridColumns/IsLockedOut'),
        mediaMinWidth: 640,
        calcColumnCssClass: (value: boolean): string =>
          value === false ? 'text-success' : 'text-danger',
        type: ColumnType.MatIcon,
        transform: (value: boolean): string => {
          return value === true ? 'lock' : 'lock_open';
        },
      },
      {
        propertyName: UserListColumns.isActive,
        title: this._translationService.get('Management/UserList/GridColumns/IsActive'),
        mediaMinWidth: 800,
        calcColumnCssClass: (value: boolean): string =>
          value === true ? 'text-success' : 'text-danger',
        type: ColumnType.MatIcon,
        transform: (value: boolean): string => {
          return value === true ? 'check' : 'close';
        },
      },
      {
        propertyName: COLUMN_NAMES.EXPAND,
        isExpandable: true,
      },
    ];

    if (
      this._permissionService.hasAnyPermission([
        SystemPermissionValue.PreviewUserProfile,
        SystemPermissionValue.AddUser,
        SystemPermissionValue.EditUserProfile,
        SystemPermissionValue.DeactivateUser,
        SystemPermissionValue.ActivateUser,
        SystemPermissionValue.DeleteUser,
        SystemPermissionValue.UnlockUser,
      ])
    ) {
      result.push({
        propertyName: COLUMN_NAMES.ACTIONS,
        isActions: true,
      } satisfies IGridColumn);
    }

    return result;
  }

  public getSortActiveColumnName(): string {
    return UserListColumns.lastName!;
  }

  public getSortActiveColumnDirection(): SortDirection {
    return 'asc';
  }

  public getContextMenuItems(user: IUserGridItemDto): IMenuItem[] {
    const result: IMenuItem[] = [];

    if (this._permissionService.hasPermission(SystemPermissionValue.EditUserProfile)) {
      result.push({
        title: this._translationService.get('Management/UserList/ContextMenu/Edit'),
        icon: 'edit',
        action: async () => this.handleEdit(user),
      });
    }

    return result;
  }

  private async handleEdit(user: IUserGridItemDto): Promise<MenuItemClickResult | undefined> {
    // if (announcements.state === AnnouncementStateValue.ARCHIVED) {
    //   this._snackBarService.translateAndShowError(
    //     'Errors/Announcements_Archived_Announcements_Cant_Be_Edited'
    //   );
    //   return;
    // }

    return this._router
      .navigateByUrl(ManagementMenuEditUser.Path + '/' + user.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }
}
