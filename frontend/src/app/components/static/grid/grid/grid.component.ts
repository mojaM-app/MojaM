import { animate, state, style, transition, trigger } from '@angular/animations';
import { MediaMatcher } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  CreateEffectOptions,
  effect,
  Inject,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { map, merge, startWith, switchMap } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { IGridData } from 'src/interfaces/common/grid.data';
import { IMenuItem } from 'src/interfaces/menu/menu-item';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { MenuItemClickResult } from '../../../../../interfaces/menu/menu.enum';
import { BottomSheetService } from '../../bottom-sheet/bottom-sheet.service';
import { DetailsDirective } from '../directive/details.directive';
import { IDetailsDirectiveContext } from '../interfaces/details.interfaces';
import { ColumnType, IGridColumn, IGridService } from './services/grid-service.interface';

@Component({
  selector: 'app-grid',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatRippleModule,
    PipesModule,
  ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class GridComponent<TGridItemDto, TGridData extends IGridData<TGridItemDto>>
  extends WithUnsubscribe()
  implements AfterViewInit
{
  @ContentChild(DetailsDirective<TGridItemDto>, { read: TemplateRef })
  public itemTemplate: TemplateRef<IDetailsDirectiveContext<TGridItemDto>> | undefined;

  public ColumnType = ColumnType;
  public expandedElement: TGridItemDto | null = null;
  public dataSource = new MatTableDataSource<TGridItemDto>([]);

  public readonly sortActiveColumnName: WritableSignal<string>;
  public readonly sortActiveColumnDirection: WritableSignal<SortDirection>;
  public readonly columns: WritableSignal<IGridColumn[]>;
  public readonly items: WritableSignal<TGridItemDto[]> = signal([]);
  public readonly itemsTotalCount: WritableSignal<number> = signal(0);
  public readonly visibleColumns: WritableSignal<IGridColumn[]> = signal([]);
  public readonly visibleColumnNames: WritableSignal<string[]> = signal([]);
  public readonly showExpandableColumn: WritableSignal<boolean> = signal(false);
  public readonly menuItems: WritableSignal<IMenuItem[]> = signal([]);

  public readonly pageSizeOptions: readonly number[] = [10, 25, 50, 100];
  public readonly pageSize: number = 10;

  private readonly _paginator = viewChild.required(MatPaginator);
  private readonly _sort = viewChild.required(MatSort);

  public constructor(
    @Inject(IS_MOBILE) public isMobile: boolean,
    @Inject('gridService') private _gridService: IGridService<TGridItemDto, TGridData>,
    private _mediaMatcher: MediaMatcher,
    private _bottomSheetService: BottomSheetService,
    browserService: BrowserWindowService
  ) {
    super();

    this.sortActiveColumnDirection = signal(_gridService.getSortActiveColumnDirection());
    this.sortActiveColumnName = signal(_gridService.getSortActiveColumnName());
    this.columns = signal(_gridService.getDisplayedColumns());

    effect(
      () => {
        if (this._sort()) {
          this.addSubscription(
            this._sort().sortChange.subscribe(() => (this._paginator().pageIndex = 0))
          );
        }

        if (this.columns()) {
          this.addSubscription(
            browserService.onResize$.subscribe(() => {
              this.refreshVisibleColumns();
            })
          );
        }

        if (this.visibleColumns()) {
          this.showExpandableColumn.set(this.visibleColumns().some(column => column.isExpandable));
          this.visibleColumnNames.set(this.visibleColumns().map(column => column.propertyName));
        }

        if (this.items()) {
          this.dataSource.data = this.items();
        }
      },
      {
        allowSignalWrites: true,
      } satisfies CreateEffectOptions
    );
  }

  public ngAfterViewInit(): void {
    this.refreshDataSource();
  }

  public showBottomSheet(row: TGridItemDto): void {
    this._bottomSheetService
      .open({
        data: this._gridService.getContextMenuItems(row),
      })
      .then((result?: MenuItemClickResult) => {
        this.handleMenuItemClickResult(result);
      });
  }

  public refreshMenuItems(row: TGridItemDto): void {
    this.menuItems.set(this._gridService.getContextMenuItems(row).reverse());
  }

  public menuItemClick(event: MouseEvent, menuItem: IMenuItem): void {
    if (menuItem.action) {
      menuItem.action().then((result?: MenuItemClickResult) => {
        this.handleMenuItemClickResult(result);
      });
    }
    event.preventDefault();
  }

  public expandDetails(row: TGridItemDto, event: any): void {
    this.expandedElement = this.isExpanded(row) ? null : row;
    event.stopPropagation();
  }

  public isExpanded(row: TGridItemDto): boolean {
    return this.expandedElement === row;
  }

  private handleMenuItemClickResult(result?: MenuItemClickResult): void {
    switch (result) {
      case MenuItemClickResult.REFRESH_GRID:
        this.refreshDataSource();
        break;
      default:
        break;
    }
  }

  private refreshVisibleColumns(): void {
    const columns = this.columns();

    let visibleColumns = columns.filter(column =>
      (column.mediaMinWidth ?? 0) > 0
        ? this._mediaMatcher.matchMedia(`(min-width: ${column.mediaMinWidth}px)`).matches
        : true
    );

    const expandColumn = visibleColumns.find(column => column.isExpandable);
    const actionsColumn = visibleColumns.find(column => column.isActions);

    if (expandColumn && actionsColumn) {
      visibleColumns = visibleColumns.filter(
        column => column !== actionsColumn && column !== expandColumn
      );

      visibleColumns.push({
        propertyName: expandColumn.propertyName,
        isActions: true,
        isExpandable: true,
      });
    }

    this.visibleColumns.set(visibleColumns);
  }

  private refreshDataSource(): void {
    this.addSubscription(
      merge(this._sort().sortChange, this._paginator().page)
        .pipe(
          startWith(null),
          switchMap(() => {
            return this._gridService.getData(
              this._sort()!.active,
              this._sort()!.direction,
              this._paginator()!.pageIndex,
              this._paginator()!.pageSize
            );
          }),
          map((response: TGridData | null) => {
            if (response === null) {
              return [];
            }
            // Only refresh the result length if there is new data. In case of rate
            // limit errors, we do not want to reset the paginator to zero, as that
            // would prevent users from re-triggering requests.
            this.itemsTotalCount.set(response.totalCount);
            return response.items;
          })
        )
        .subscribe((items: TGridItemDto[]) => this.items.set(items))
    );
  }
}
