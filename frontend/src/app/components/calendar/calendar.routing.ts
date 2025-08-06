import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './calendar.component';
import { IRouteData } from 'src/interfaces/common/route.data';

const routes: Routes = [
  { path: '**', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    component: CalendarComponent,
    data: { pullToRefresh: true } satisfies IRouteData,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarRoutingModule {}
