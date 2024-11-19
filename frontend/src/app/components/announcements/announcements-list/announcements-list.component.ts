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
import {
  AnnouncementsGridData,
  IAnnouncementsGridItemDto,
} from 'src/interfaces/announcements/announcements-list.interfaces';
import { PipesModule } from 'src/pipes/pipes.module';
import { AnnouncementsListService } from 'src/services/announcements/announcements-list.service';
import { AnnouncementsListColumns } from './announcements-list.columns';

@Component({
  selector: 'app-announcements-list',
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
  ],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AnnouncementsListComponent
  extends BaseGridComponent<IAnnouncementsGridItemDto, AnnouncementsGridData>
  implements AfterViewInit
{
  public readonly displayedColumns: string[] = [] as const;
  public readonly displayedColumnsWithExpand = [...this.displayedColumns, 'expand'] as const;

  public readonly tableColumns = AnnouncementsListColumns;
  public expandedElement: IAnnouncementsGridItemDto | null = null;

  public constructor(private _announcementsListService: AnnouncementsListService) {
    super();
  }

  protected override getData(
    sortColumn: string,
    sortDirection: SortDirection,
    pageIndex: number,
    pageSize: number
  ): Observable<AnnouncementsGridData | null> {
    return this._announcementsListService.get(sortColumn, sortDirection, pageIndex, pageSize);
  }
}
