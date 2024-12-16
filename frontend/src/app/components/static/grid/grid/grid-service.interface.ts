import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IMenuItem } from 'src/interfaces/menu/menu-item';

export const COLUMN_NAMES = {
  EXPAND: 'expand',
  ACTIONS: 'actions',
};

export enum ColumnType {
  Date,
  DateEgo,
  DateTime,
  Number,
  Time,
}

export interface IGridExpandableColumn {
  isExpandable?: boolean;
}

export interface IGridActionsColumn {
  isActions?: boolean;
}

export interface IGridColumn extends IGridExpandableColumn, IGridActionsColumn {
  propertyName: string;
  title?: string;
  type?: ColumnType;
  cssClass?: string;
  mediaMinWidth?: number;
  transform?: (value: any) => string;
}

export interface IGridService<TGridItemDto, TGridData extends IGridData<TGridItemDto>> {
  getDisplayedColumns(): IGridColumn[];

  getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<TGridData | null>;

  getSortActiveColumnName(): string;
  getSortActiveColumnDirection(): SortDirection;

  getContextMenuItems(item: TGridItemDto): IMenuItem[];
}
