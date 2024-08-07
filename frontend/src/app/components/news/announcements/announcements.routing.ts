import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnnouncementsComponent } from './announcements.component';

const routes: Routes = [
  { path: '**', redirectTo: '', pathMatch: 'full' },
  { path: '', component: AnnouncementsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnnouncementsRoutingModule {}
