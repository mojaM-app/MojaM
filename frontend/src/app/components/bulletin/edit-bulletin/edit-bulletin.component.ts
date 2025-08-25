import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  model,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BulletinFormComponent } from '../bulletin-form/bulletin-form.component';
import { PipesModule } from 'src/pipes/pipes.module';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { EditBulletinDto } from '../models/edit-bulletin.model';
import { AuthService } from 'src/services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinService } from '../services/bulletin.service';
import { WithUnsubscribe } from 'src/mixins/with-unsubscribe';
import { BulletinListMenu, BulletinMenu } from '../bulletin.menu';
import { GuidUtils } from 'src/utils/guid.utils';
import { IBulletin } from '../interfaces/bulletin';

@Component({
  selector: 'app-edit-bulletin',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    BulletinFormComponent,
    PipesModule,
    CardHeaderComponent,
  ],
  templateUrl: './edit-bulletin.component.html',
  styleUrl: './edit-bulletin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBulletinComponent extends WithUnsubscribe() implements OnInit {
  protected readonly bulletin = model<EditBulletinDto>();

  private readonly _formComponent = viewChild(BulletinFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _bulletinService: BulletinService
  ) {
    super();

    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToBulletin();
      });
    });
  }

  public ngOnInit(): void {
    const id = this._route.snapshot.params['id'];

    if (!GuidUtils.isValidGuid(id)) {
      this.navigateToBulletinList();
      return;
    }

    this.addSubscription(
      this._bulletinService.get(id).subscribe((bulletin: IBulletin) => {
        if (bulletin && GuidUtils.isValidGuid(bulletin.id)) {
          this.bulletin.set(EditBulletinDto.create(bulletin));
        } else {
          this.navigateToBulletinList();
        }
      })
    );
  }

  public save(): void {
    const form = this._formComponent();
    const bulletinId = this.bulletin()?.id;

    if (!form || !form.containsValidData() || !GuidUtils.isValidGuid(bulletinId)) {
      form?.showErrors();
      return;
    }

    const dto = new EditBulletinDto(bulletinId!, form.controls);
    this._bulletinService.update(dto).subscribe(() => {
      this.navigateToBulletinList();
    });
  }

  public cancel(): void {
    this.navigateToBulletinList();
  }

  private navigateToBulletinList(): void {
    this._router.navigateByUrl(BulletinListMenu.Path);
  }

  private navigateToBulletin(): void {
    this._router.navigateByUrl(BulletinMenu.Path);
  }
}
