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
import { PipesModule } from 'src/pipes/pipes.module';
import { CardHeaderComponent } from '../../static/card-header/card-header.component';
import { BulletinFormComponent } from '../bulletin-form/bulletin-form.component';
import { AddBulletinDto } from '../models/add-bulletin.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/services/auth/auth.service';
import { BulletinService } from '../services/bulletin.service';
import { BulletinMenu } from '../bulletin.menu';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-bulletin',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    CardHeaderComponent,
    PipesModule,
    BulletinFormComponent,
  ],
  templateUrl: './add-bulletin.component.html',
  styleUrl: './add-bulletin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBulletinComponent implements OnInit {
  public readonly bulletin = model<AddBulletinDto>();

  private readonly _formComponent = viewChild(BulletinFormComponent);

  public constructor(
    authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _bulletinService: BulletinService
  ) {
    effect(() => {
      authService.onAuthStateChanged.whenUnauthenticated(() => {
        this.navigateToBulletin();
      });
    });

    effect(() => {
      if (this._formComponent() && environment.production === false) {
        this._formComponent()!.formGroup.patchValue({
          properties: {
            date: new Date(),
            title: 'Tekst do formacji od ' + new Date().toLocaleDateString(),
            number: 700,
            introduction: 'Wprowadzenie do biuletynu...',
            tipsForWork: 'Wskazówki do pracy...',
            dailyPrayer: 'Modlitwa na dziś...',
          },
          days: [
            {
              date: new Date(),
              title: 'Dzień 1',
              sections: [{ content: 'Sekcja 1' }, { content: 'Sekcja 2' }],
            },
          ],
        });
      }
    });
  }

  public ngOnInit(): void {
    const bulletin = AddBulletinDto.create();
    this.bulletin.set(bulletin);
  }

  public save(): void {
    const form = this._formComponent();

    if (!form || !form.containsValidData()) {
      console.error(form?.getAllFormErrors());
      form?.showErrors();
      return;
    }

    const dto = new AddBulletinDto(form.controls);
    this._bulletinService.create(dto).subscribe(() => {
      this.navigateToBulletinList();
    });
  }

  public cancel(): void {
    this.navigateToBulletinList();
  }

  private navigateToBulletinList(): void {
    //this._router.navigateByUrl(BulletinListMenu.Path);
  }

  private navigateToBulletin(): void {
    this._router.navigateByUrl(BulletinMenu.Path);
  }
}
