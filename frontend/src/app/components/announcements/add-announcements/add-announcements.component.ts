import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, model, OnInit, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnouncementsService } from 'src/app/components/announcements/services/announcements.service';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { PipesModule } from 'src/pipes/pipes.module';
import { AuthService } from 'src/services/auth/auth.service';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { AnnouncementsFormComponent } from '../announcements-form/announcements-form.component';
import { AnnouncementsListMenu, AnnouncementsMenu } from '../announcements.menu';
import { IAnnouncements } from '../interfaces/announcements';
import { AddAnnouncementsDto } from '../models/add-announcements.model';

@Component({
  selector: 'app-add-announcements',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    AnnouncementsFormComponent,
    CardHeaderComponent,
    PipesModule,
  ],
  templateUrl: './add-announcements.component.html',
  styleUrl: './add-announcements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAnnouncementsComponent extends WithUnsubscribe() implements OnInit {
  public readonly announcements = model<AddAnnouncementsDto>();

  private readonly _formComponent = viewChild(AnnouncementsFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _announcementsService: AnnouncementsService
  ) {
    super();

    this.addSubscription(
      authService.onAuthStateChanged.subscribe(() => {
        this.navigateToAnnouncements();
      })
    );
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    const announcements = AddAnnouncementsDto.create();

    if (id) {
      this.addSubscription(
        this._announcementsService.get(id).subscribe((response: IAnnouncements) => {
          if (response) {
            announcements.set(response);
          }
          this.announcements.set(announcements);
        })
      );
    } else {
      this.announcements.set(announcements);
    }
  }

  public save(): void {
    const form = this._formComponent();

    if (!form || !form.containsValidData()) {
      form?.showErrors();
      return;
    }

    const dto = new AddAnnouncementsDto(form.controls);
    this._announcementsService.create(dto).subscribe(() => {
      this.navigateToAnnouncementsList();
    });
  }

  public cancel(): void {
    this.navigateToAnnouncementsList();
  }

  private navigateToAnnouncementsList(): void {
    this._router.navigateByUrl(AnnouncementsListMenu.Path);
  }

  private navigateToAnnouncements(): void {
    this._router.navigateByUrl(AnnouncementsMenu.Path);
  }
}
