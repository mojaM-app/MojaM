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
        transform: (value: string) => this._translationService.get(`Announcements/State/${value}`),
      },
      {
        propertyName: AnnouncementsListColumns.createdAt,
        title: this._translationService.get('Announcements/List/GridColumns/CreatedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 340,
      },
      {
        propertyName: AnnouncementsListColumns.createdBy!,
        title: this._translationService.get('Announcements/List/GridColumns/CreatedBy'),
        mediaMinWidth: 840,
      },
      {
        propertyName: AnnouncementsListColumns.updatedAt!,
        title: this._translationService.get('Announcements/List/GridColumns/UpdatedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 900,
      },
      {
        propertyName: AnnouncementsListColumns.publishedAt!,
        title: this._translationService.get('Announcements/List/GridColumns/PublishedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 420,
      },
      {
        propertyName: AnnouncementsListColumns.publishedBy!,
        title: this._translationService.get('Announcements/List/GridColumns/PublishedBy'),
        mediaMinWidth: 760,
      },
      {
        propertyName: AnnouncementsListColumns.itemsCount!,
        title: this._translationService.get('Announcements/List/GridColumns/ItemsCount'),
        type: ColumnType.Number,
        mediaMinWidth: 600,
      },
      {
        propertyName: COLUMN_NAMES.EXPAND,
        isExpandable: true,
      },
    ] as const;
  }

  public getSortActiveColumnName(): string {
    return AnnouncementsListColumns.validFromDate!;
  }
}
