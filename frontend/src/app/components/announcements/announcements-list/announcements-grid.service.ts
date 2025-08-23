import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Router } from '@angular/router';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IAnnouncementsGridItemDto } from 'src/app/components/announcements/interfaces/announcements-list.interfaces';
import { AnnouncementsListService } from 'src/app/components/announcements/services/announcements-list.service';
import {
  COLUMN_NAMES,
  ColumnType,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/services/grid-service.interface';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
import { DeleteResult } from 'src/core/delete-result.enum';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { IDialogSettings } from 'src/core/interfaces/common/dialog.settings';
import { IGridData } from 'src/core/interfaces/common/grid.data';
import { IMenuItem } from 'src/core/interfaces/menu/menu-item';
import { PermissionService } from 'src/services/auth/permission.service';
import { DialogService } from 'src/services/dialog/dialog.service';
import { CultureService } from 'src/services/translate/culture.service';
import { TranslationService } from 'src/services/translate/translation.service';
import { MenuItemClickResult } from '../../../../core/interfaces/menu/menu.enum';
import { BaseGridService } from '../../static/grid/grid/services/base-grid.service';
import { AnnouncementStateValue } from '../enums/announcement-state.enum';
import {
  AddAnnouncementsMenu,
  EditAnnouncementsMenu,
  PreviewAnnouncementsMenu,
} from '../announcements.menu';
import { AnnouncementsService } from '../services/announcements.service';
import { AnnouncementsListColumns } from './announcements-list.columns';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsGridService
  extends BaseGridService
  implements IGridService<IAnnouncementsGridItemDto, IGridData<IAnnouncementsGridItemDto>>
{
  public constructor(
    private _listService: AnnouncementsListService,
    private _announcementsService: AnnouncementsService,
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
        calcColumnCssClass: (): string => 'text-center',
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
    return AnnouncementsListColumns.createdAt!;
  }

  public getSortActiveColumnDirection(): SortDirection {
    return 'desc';
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

    if (
      this._permissionService.hasPermission(SystemPermissionValue.PublishAnnouncements) &&
      announcements.state === AnnouncementStateValue.DRAFT
    ) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Publish'),
        icon: 'publish',
        action: async () => this.handlePublish(announcements),
      });
    }

    if (this._permissionService.hasPermission(SystemPermissionValue.AddAnnouncements)) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Copy'),
        icon: 'content_copy',
        action: async () => this.handleCopy(announcements),
      });
    }

    if (
      announcements.state !== AnnouncementStateValue.ARCHIVED &&
      this._permissionService.hasPermission(SystemPermissionValue.EditAnnouncements)
    ) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Edit'),
        icon: EditAnnouncementsMenu.Icon,
        action: async () => this.handleEdit(announcements),
      });
    }

    if (this._permissionService.hasPermission(SystemPermissionValue.PreviewAnnouncementsList)) {
      result.push({
        title: this._translationService.get('Announcements/List/ContextMenu/Preview'),
        icon: PreviewAnnouncementsMenu.Icon,
        action: async () => this.handlePreview(announcements),
      });
    }

    return result;
  }

  private async handlePreview(
    announcements: IAnnouncementsGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    return this._router
      .navigateByUrl(PreviewAnnouncementsMenu.Path + '/' + announcements.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handleCopy(
    announcements: IAnnouncementsGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    return this._router
      .navigateByUrl(AddAnnouncementsMenu.Path + '/' + announcements.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handlePublish(
    announcements: IAnnouncementsGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    const confirmed = await this._dialogService
      .confirm({
        message: {
          text: 'Announcements/List/PublishConfirmText',
          interpolateParams: {
            createdAt: this._datetimePipe.transform(announcements.createdAt),
            createdBy: announcements.createdBy,
          },
        },
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnPublish',
      } satisfies IDialogSettings)
      .then((result: boolean) => result);

    if (confirmed !== true) {
      return;
    }

    return firstValueFrom(
      this._announcementsService
        .publish(announcements.id)
        .pipe(map((result: boolean) => (result ? MenuItemClickResult.REFRESH_GRID : undefined)))
    );
  }

  private async handleEdit(
    announcements: IAnnouncementsGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    if (announcements.state === AnnouncementStateValue.ARCHIVED) {
      this._snackBarService.translateAndShowError({
        message: 'Errors/Announcements_Archived_Announcements_Cant_Be_Edited',
      });
      return;
    }

    return this._router
      .navigateByUrl(EditAnnouncementsMenu.Path + '/' + announcements.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handleDelete(
    announcements: IAnnouncementsGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
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

    const result = await firstValueFrom(this._announcementsService.delete(announcements.id));

    if (result === DeleteResult.Success) {
      return MenuItemClickResult.REFRESH_GRID;
    }

    if (result === DeleteResult.DbFkConstraintError) {
      this._snackBarService.translateAndShowError({
        message: 'Errors/Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted',
      });
      return MenuItemClickResult.NONE;
    }

    throw new Error('Not supported delete result');
  }
}
