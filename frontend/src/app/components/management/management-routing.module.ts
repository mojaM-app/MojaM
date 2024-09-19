import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemPermissionValue } from 'src/core/system-permission.enum';
import { PermissionGuard } from 'src/services/auth/permission.guard';
import { ManagementMenuUserList } from './management.menu';

const routes: Routes = [
  { path: '**', redirectTo: ManagementMenuUserList.Route, pathMatch: 'full' },
  {
    path: ManagementMenuUserList.Route,
    loadComponent: () =>
      import('./users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [PermissionGuard],
    data: {
      permissions: [SystemPermissionValue.PreviewUserList],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagementRoutingModule {}
