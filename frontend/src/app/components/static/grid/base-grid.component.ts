import { AfterViewInit, Directive, effect, signal, viewChild, WritableSignal } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { map, merge, Observable, startWith, switchMap } from 'rxjs';
import { GridData } from 'src/interfaces/common/grid.data';

@Directive()
export abstract class BaseGridComponent<TGridItemDto, TGridData extends GridData<TGridItemDto>>
  implements AfterViewInit
{
  public readonly itemsTotalCount: WritableSignal<number> = signal(0);
  public readonly data: WritableSignal<TGridItemDto[]> = signal([]);

  private readonly _paginator = viewChild.required(MatPaginator);
  private readonly _sort = viewChild.required(MatSort);

  public constructor() {
    effect(() => {
      if (this._sort()) {
        this._sort().sortChange.subscribe(() => (this._paginator().pageIndex = 0));
      }
    });
  }

  public ngAfterViewInit(): void {
    merge(this._sort().sortChange, this._paginator().page)
      .pipe(
        startWith(null),
        switchMap(() => {
          return this.getData(
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
      .subscribe((data: TGridItemDto[]) => this.data.set(data));
  }

  protected abstract getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<TGridData | null>;
}
