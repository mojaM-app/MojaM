import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import { BaseGridComponent } from 'src/app/components/static/grid/base-grid.component';
import { IUserGridItemDto, UsersGridData } from 'src/interfaces/users/user-list.interfaces';
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
    UserDetailsComponent,
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
export class UserListComponent
  extends BaseGridComponent<IUserGridItemDto, UsersGridData>
  implements AfterViewInit
{
  public readonly displayedColumns: string[] = [
    UserListColumns.firstName!,
    UserListColumns.lastName!,
    UserListColumns.email,
    UserListColumns.phone,
  ] as const;
  public readonly displayedColumnsWithExpand = [...this.displayedColumns, 'expand'] as const;

  public readonly tableColumns = UserListColumns;
  public expandedElement: IUserGridItemDto | null = null;

  public constructor(private _userListService: UserListService) {
    super();
  }

  protected override getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<UsersGridData | null> {
    return this._userListService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }
}
