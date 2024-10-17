import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { map, merge, startWith, switchMap } from 'rxjs';
import { IUserGridItemDto, UsersGridData } from 'src/interfaces/users/users.interfaces';
import { PipesModule } from 'src/pipes/pipes.module';
import { UserListService } from 'src/services/users/user-list.service';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserListColumns } from './user-list.columns';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatSort,
    MatSortModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    PipesModule,
    UserDetailsComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class UserListComponent implements AfterViewInit {
  public readonly displayedColumns: string[] = [
    UserListColumns.firstName!,
    UserListColumns.lastName!,
    UserListColumns.email,
    UserListColumns.phone,
  ] as const;
  public readonly displayedColumnsWithExpand = [...this.displayedColumns, 'expand'] as const;

  public usersTotalCount: WritableSignal<number> = signal(0);
  public data: WritableSignal<IUserGridItemDto[]> = signal([]);
  public expandedElement: IUserGridItemDto | null = null;

  public readonly tableColumns = UserListColumns;

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  public constructor(private _userListService: UserListService) {
    effect(() => {
      if (this.sort()) {
        this.sort().sortChange.subscribe(() => (this.paginator().pageIndex = 0));
      }
    });
  }

  public ngAfterViewInit(): void {
    merge(this.sort().sortChange, this.paginator().page)
      .pipe(
        startWith(null),
        switchMap(() => {
          return this._userListService.get(
            this.sort()!.active,
            this.sort()!.direction,
            this.paginator()!.pageIndex,
            this.paginator()!.pageSize
          );
        }),
        map((response: UsersGridData | null) => {
          if (response === null) {
            return [];
          }

          // Only refresh the result length if there is new data. In case of rate
          // limit errors, we do not want to reset the paginator to zero, as that
          // would prevent users from re-triggering requests.
          this.usersTotalCount.set(response.totalCount);
          return response.items;
        })
      )
      .subscribe((data: IUserGridItemDto[]) => this.data.set(data));
  }
}
