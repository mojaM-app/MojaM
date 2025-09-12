import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Router } from '@angular/router';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IBulletinGridItemDto } from 'src/app/components/bulletin/interfaces/bulletin-list.interfaces';
import { BulletinListService } from 'src/app/components/bulletin/services/bulletin-list.service';
import {
  COLUMN_NAMES,
  ColumnType,
  IGridColumn,
  IGridService,
} from 'src/app/components/static/grid/grid/services/grid-service.interface';
import { SnackBarService } from 'src/app/components/static/snackbar/snack-bar.service';
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
import { BulletinState } from '../enums/bulletin-state.enum';
import { AddBulletinMenu, EditBulletinMenu, PreviewBulletinMenu } from '../bulletin.menu';
import { BulletinService } from '../services/bulletin.service';
import { BULLETIN_LIST_COLUMNS } from './bulletin-list.columns';
import { DeleteResult } from 'src/core/delete-result.enum';

@Injectable({
  providedIn: 'root',
})
export class BulletinGridService
  extends BaseGridService
  implements IGridService<IBulletinGridItemDto, IGridData<IBulletinGridItemDto>>
{
  public constructor(
    private _listService: BulletinListService,
    private _bulletinService: BulletinService,
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
  ): Observable<IGridData<IBulletinGridItemDto> | null> {
    return this._listService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }

  public getDisplayedColumns(): IGridColumn[] {
    const result: IGridColumn[] = [
      {
        propertyName: BULLETIN_LIST_COLUMNS.date!,
        title: this._translationService.get('Bulletin/List/GridColumns/Date'),
        type: ColumnType.Date,
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.title!,
        title: this._translationService.get('Bulletin/List/GridColumns/Title'),
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.number!,
        title: this._translationService.get('Bulletin/List/GridColumns/Number'),
        type: ColumnType.Number,
        mediaMinWidth: 400,
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.state,
        title: this._translationService.get('Bulletin/List/GridColumns/State'),
        transform: (value: string): string =>
          this._translationService.get(`Bulletin/State/${value}`),
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.updatedAt!,
        title: this._translationService.get('Bulletin/List/GridColumns/UpdatedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 900,
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.updatedBy!,
        title: this._translationService.get('Bulletin/List/GridColumns/UpdatedBy'),
        mediaMinWidth: 1000,
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.publishedAt!,
        title: this._translationService.get('Bulletin/List/GridColumns/PublishedAt'),
        type: ColumnType.DateTime,
        mediaMinWidth: 600,
      },
      {
        propertyName: BULLETIN_LIST_COLUMNS.publishedBy!,
        title: this._translationService.get('Bulletin/List/GridColumns/PublishedBy'),
        mediaMinWidth: 700,
      },
    ];

    if (
      this._permissionService.hasAnyPermission([
        SystemPermissionValue.EditBulletin,
        SystemPermissionValue.DeleteBulletin,
        SystemPermissionValue.PublishBulletin,
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
    return BULLETIN_LIST_COLUMNS.createdAt!;
  }

  public getSortActiveColumnDirection(): SortDirection {
    return 'desc';
  }

  public getContextMenuItems(bulletin: IBulletinGridItemDto): IMenuItem[] {
    const result: IMenuItem[] = [];

    if (this._permissionService.hasPermission(SystemPermissionValue.DeleteBulletin)) {
      result.push({
        title: this._translationService.get('Bulletin/List/ContextMenu/Delete'),
        icon: 'delete',
        action: async () => this.handleDelete(bulletin),
      });
    }

    if (
      this._permissionService.hasPermission(SystemPermissionValue.PublishBulletin) &&
      bulletin.state === BulletinState.DRAFT
    ) {
      result.push({
        title: this._translationService.get('Bulletin/List/ContextMenu/Publish'),
        icon: 'publish',
        action: async () => this.handlePublish(bulletin),
      });
    }

    // if (this._permissionService.hasPermission(SystemPermissionValue.AddBulletin)) {
    //   result.push({
    //     title: this._translationService.get('Bulletin/List/ContextMenu/Copy'),
    //     icon: 'content_copy',
    //     action: async () => this.handleCopy(bulletin),
    //   });
    // }

    if (this._permissionService.hasPermission(SystemPermissionValue.EditBulletin)) {
      result.push({
        title: this._translationService.get('Bulletin/List/ContextMenu/Edit'),
        icon: EditBulletinMenu.Icon,
        action: async () => this.handleEdit(bulletin),
      });
    }

    // if (this._permissionService.hasPermission(SystemPermissionValue.PreviewBulletinList)) {
    //   result.push({
    //     title: this._translationService.get('Bulletin/List/ContextMenu/Preview'),
    //     icon: PreviewBulletinMenu.Icon,
    //     action: async () => this.handlePreview(bulletin),
    //   });
    // }

    return result;
  }

  private async handlePreview(
    bulletin: IBulletinGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    return this._router
      .navigateByUrl(PreviewBulletinMenu.Path + '/' + bulletin.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handleCopy(
    bulletin: IBulletinGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    return this._router
      .navigateByUrl(AddBulletinMenu.Path + '/' + bulletin.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handlePublish(
    bulletin: IBulletinGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    const confirmed = await this._dialogService
      .confirm({
        message: {
          text: 'Bulletin/List/PublishConfirmText',
          interpolateParams: {
            createdAt: this._datetimePipe.transform(bulletin.createdAt),
            createdBy: bulletin.createdBy,
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
      this._bulletinService
        .publish(bulletin.id)
        .pipe(
          map((result: boolean) =>
            result ? MenuItemClickResult.REFRESH_GRID : MenuItemClickResult.NONE
          )
        )
    );
  }

  private async handleEdit(
    bulletin: IBulletinGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    return this._router
      .navigateByUrl(EditBulletinMenu.Path + '/' + bulletin.id)
      .then(() => MenuItemClickResult.REDIRECT_TO_URL);
  }

  private async handleDelete(
    bulletin: IBulletinGridItemDto
  ): Promise<MenuItemClickResult | undefined> {
    const confirmed = await this._dialogService
      .confirm({
        message: {
          text: 'Bulletin/List/DeleteConfirmText',
          interpolateParams: {
            createdAt: this._datetimePipe.transform(bulletin.createdAt),
            createdBy: bulletin.createdBy,
          },
        },
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnDelete',
      } satisfies IDialogSettings)
      .then((result: boolean) => result);

    if (confirmed !== true) {
      return;
    }

    const result = await firstValueFrom(this._bulletinService.delete(bulletin.id));

    if (result === DeleteResult.Success) {
      return MenuItemClickResult.REFRESH_GRID;
    }

    if (result === DeleteResult.DbFkConstraintError) {
      this._snackBarService.translateAndShowError({
        message: 'Errors/Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted',
      });
      return MenuItemClickResult.NONE;
    }

    return MenuItemClickResult.NONE;
  }
}
