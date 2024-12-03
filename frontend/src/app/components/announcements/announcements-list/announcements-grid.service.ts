import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IAnnouncementsGridItemDto } from 'src/app/components/announcements/interfaces/announcements-list.interfaces';
import { AnnouncementsListService } from 'src/app/components/announcements/services/announcements-list.service';
import {
  COLUMN_NAMES,
  ColumnType,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/grid-service.interface';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IDialogSettings } from 'src/interfaces/common/dialog.settings';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IMenuItem } from 'src/interfaces/menu/menu-item';
import { PermissionService } from 'src/services/auth/permission.service';
import { DialogService } from 'src/services/dialog/dialog.service';
import { SnackBarService } from 'src/services/snackbar/snack-bar.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { BottomSheetActionResult } from '../../static/bottom-sheet/bottom-sheet.enum';
import { BaseGridService } from '../../static/grid/grid/base-grid.service';
import { AnnouncementStateValue } from '../announcement-state.enum';
import { AnnouncementsListColumns } from './announcements-list.columns';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsGridService
  extends BaseGridService
  implements IGridService<IAnnouncementsGridItemDto, IGridData<IAnnouncementsGridItemDto>>
{
  public constructor(
    permissionService: PermissionService,
    private _listService: AnnouncementsListService,
    dialogService: DialogService,
    translationService: TranslationService,
    snackBarService: SnackBarService,
    cultureService: CultureService
  ) {
    super(permissionService, dialogService, translationService, snackBarService, cultureService);
  }

  public getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<IGridData<IAnnouncementsGridItemDto> | null> {
    return this._listService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }

  public getDisplayedColumns(): IGridColumn[] {
    const result: IGridColumn[] = [
      {
        propertyName: AnnouncementsListColumns.validFromDate!,
        title: this._translationService.get('Announcements/List/GridColumns/ValidFrom'),
        type: ColumnType.Date,
      },
      {
        propertyName: AnnouncementsListColumns.state,
        title: this._translationService.get('Announcements/List/GridColumns/State'),
        cssClass: 'text-center',
        transform: (value: string): string =>
          this._translationService.get(`Announcements/State/${value}`),
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
    ];

    if (
      this._permissionService.hasAnyPermission([
        SystemPermissionValue.EditAnnouncements,
        SystemPermissionValue.DeleteAnnouncements,
        SystemPermissionValue.PublishAnnouncements,
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
    return AnnouncementsListColumns.validFromDate!;
  }

  public getContextMenuItems(announcements: IAnnouncementsGridItemDto): IMenuItem[] {
    const result: IMenuItem[] = [];

    if (this._permissionService.hasPermission(SystemPermissionValue.DeleteAnnouncements)) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Delete'),
        icon: 'delete',
        action: async () => this.handleDelete(announcements),
      });
    }

    if (this._permissionService.hasPermission(SystemPermissionValue.EditAnnouncements)) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Edit'),
        icon: 'edit',
        action: async () => this.handleEdit(announcements),
      });
    }

    return result;
  }

  private async handleEdit(
    announcements: IAnnouncementsGridItemDto
  ): Promise<BottomSheetActionResult | undefined> {
    if (announcements.state === AnnouncementStateValue.ARCHIVED) {
      this._snackBarService.translateAndShowError(
        'Errors/Announcements_Archived_Announcements_Cant_Be_Edited'
      );
      return;
    }

    //this._dialogService.openEditAnnouncementDialog(announcements.id);
    return;
  }

  private async handleDelete(
    announcements: IAnnouncementsGridItemDto
  ): Promise<BottomSheetActionResult | undefined> {
    const confirmed = await this._dialogService
      .confirm({
        message: {
          text: 'Announcements/List/DeleteConfirmText',
          interpolateParams: {
            createdAt: this._datetimePipe.transform(announcements.createdAt),
            createdBy: announcements.createdBy,
          },
        },
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnDelete',
      } satisfies IDialogSettings)
      .then((result: boolean) => result);

    if (confirmed !== true) {
      return;
    }

    return firstValueFrom(
      this._listService
        .delete(announcements.id)
        .pipe(map((result: boolean) => (result ? BottomSheetActionResult.REFRESH_GRID : undefined)))
    );
  }
}