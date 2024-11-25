import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';
import {
  COLUMN_NAMES,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/grid-service.interface';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IUserGridItemDto } from 'src/interfaces/users/user-list.interfaces';
import { TranslationService } from 'src/services/translate/translation.service';
import { UserListService } from 'src/services/users/user-list.service';
import { UserListColumns } from './user-list.columns';

@Injectable({
  providedIn: 'root',
})
export class UserGridService
  implements IGridService<IUserGridItemDto, IGridData<IUserGridItemDto>>
{
  public constructor(
    private _listService: UserListService,
    private _translationService: TranslationService
  ) {}

  public getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<IGridData<IUserGridItemDto> | null> {
    return this._listService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }

  public getDisplayedColumns(): IGridColumn[] {
    return [
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
      },
      {
        propertyName: UserListColumns.phone,
        title: this._translationService.get('Management/UserList/GridColumns/Phone'),
      },
      {
        propertyName: COLUMN_NAMES.EXPAND,
        isExpandable: true,
      },
    ] as const;
  }

  public getSortActiveColumnName(): string {
    return UserListColumns.lastName!;
  }
}
