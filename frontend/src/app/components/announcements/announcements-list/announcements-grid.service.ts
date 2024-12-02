import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';
import {
  COLUMN_NAMES,
  ColumnType,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/grid-service.interface';
import { IAnnouncementsGridItemDto } from 'src/interfaces/announcements/announcements-list.interfaces';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IMenuItem } from 'src/interfaces/menu/menu-item';
import { AnnouncementsListService } from 'src/services/announcements/announcements-list.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { AnnouncementsListColumns } from './announcements-list.columns';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsGridService
  implements IGridService<IAnnouncementsGridItemDto, IGridData<IAnnouncementsGridItemDto>>
{
  public constructor(
    private _listService: AnnouncementsListService,
    private _translationService: TranslationService
  ) {}

  public getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<IGridData<IAnnouncementsGridItemDto> | null> {
    return this._listService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }

  public getDisplayedColumns(): IGridColumn[] {
    return [
      {
        propertyName: AnnouncementsListColumns.validFromDate!,
        title: this._translationService.get('Announcements/List/GridColumns/ValidFrom'),
        type: ColumnType.Date,
      },
      {
        propertyName: AnnouncementsListColumns.state,
        title: this._translationService.get('Announcements/List/GridColumns/State'),
        cssClass: 'text-center',
        transform: (value: string) => this._translationService.get(`Announcements/State/${value}`),
      },
      {
        propertyName: AnnouncementsListColumns.createdAt,
        title: this._translationService.get('Announcements/List/GridColumns/CreatedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 400,
      },
      {
        propertyName: AnnouncementsListColumns.createdBy!,
        title: this._translationService.get('Announcements/List/GridColumns/CreatedBy'),
        mediaMinWidth: 900,
      },
      {
        propertyName: AnnouncementsListColumns.updatedAt!,
        title: this._translationService.get('Announcements/List/GridColumns/UpdatedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 1000,
      },
      {
        propertyName: AnnouncementsListColumns.publishedAt!,
        title: this._translationService.get('Announcements/List/GridColumns/PublishedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 500,
      },
      {
        propertyName: AnnouncementsListColumns.publishedBy!,
        title: this._translationService.get('Announcements/List/GridColumns/PublishedBy'),
        mediaMinWidth: 800,
      },
      {
        propertyName: AnnouncementsListColumns.itemsCount!,
        title: this._translationService.get('Announcements/List/GridColumns/ItemsCount'),
        type: ColumnType.Number,
        mediaMinWidth: 650,
        cssClass: 'text-center',
      },
      // {
      //   propertyName: COLUMN_NAMES.EXPAND,
      //   isExpandable: true,
      // },
      {
        propertyName: COLUMN_NAMES.ACTIONS,
        isActions: true,
      },
    ] as const;
  }

  public getSortActiveColumnName(): string {
    return AnnouncementsListColumns.validFromDate!;
  }

  public getContextMenuItems(item: IAnnouncementsGridItemDto): IMenuItem[] {
    return [
      {
        title: this._translationService.get('Announcements/List/ContextMenu/Edit'),
        icon: 'edit',
        action: (): void => {
          console.log('Edit announcement', item);
        },
      },
      {
        title: this._translationService.get('Announcements/List/ContextMenu/Delete'),
        icon: 'delete',
        action: (): void => {
          console.log('Delete announcement', item);
        },
      },
    ];
  }
}
