import { animate, state, style, transition, trigger } from '@angular/animations';
import { MediaMatcher } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CreateEffectOptions,
  effect,
  Inject,
  Input,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { map, merge, startWith, switchMap } from 'rxjs';
import { IS_MOBILE } from 'src/app/app.config';
import { IGridData } from 'src/interfaces/common/grid.data';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { BrowserWindowService } from 'src/services/browser/browser-window.service';
import { BottomSheetService } from '../../bottom-sheet/bottom-sheet.service';
import { ColumnType, IGridColumn, IGridService } from './grid-service.interface';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
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
  @Input()
  public itemTemplate: TemplateRef<any> | undefined;

  public ColumnType = ColumnType;
  public expandedElement: TGridItemDto | null = null;
  public dataSource = new MatTableDataSource<TGridItemDto>([]);

  public readonly sortActiveColumnName: WritableSignal<string>;
  public readonly columns: WritableSignal<IGridColumn[]>;
  public readonly items: WritableSignal<TGridItemDto[]> = signal([]);
  public readonly itemsTotalCount: WritableSignal<number> = signal(0);
  public readonly visibleColumns: WritableSignal<IGridColumn[]> = signal([]);
  public readonly visibleColumnNames: WritableSignal<string[]> = signal([]);
  public readonly showExpandableColumn: WritableSignal<boolean> = signal(false);

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
      .subscribe((items: TGridItemDto[]) => this.items.set(items));
  }

  public showRowMenu(row: TGridItemDto): void {
    console.log('showRowMenu', row);
  }

  public showBottomSheet(row: TGridItemDto): void {
    this._bottomSheetService.open({
      data: this._gridService.getContextMenuItems(row),
    });
  }

  private refreshVisibleColumns(): void {
    const columns = this.columns();
    this.visibleColumns.set(
      columns.filter(column =>
        (column.mediaMinWidth ?? 0) > 0
          ? this._mediaMatcher.matchMedia(`(min-width: ${column.mediaMinWidth}px)`).matches
          : true
      )
    );
  }
}
