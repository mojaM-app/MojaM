import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  Inject,
  input,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { WithForm } from 'src/mixins/with-form.mixin';
import { BulletinFormBuilder, IBulletinDayForm, IBulletinForm } from './bulletin.form';
import { IS_MOBILE } from 'src/app/app.config';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BulletinDto } from '../models/bulletin.model';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../static/confirmation-dialog/confirm-dialog.component';
import { DialogService } from 'src/services/dialog/dialog.service';
import { IDialogSettings } from 'src/core/interfaces/common/dialog.settings';
import { DynamicButtonComponent } from '../../static/dynamic-button/dynamic-button.component';
import { TabBulletinPropertiesComponent } from './tab-bulletin-properties/tab-bulletin-properties.component';
import { PipesModule } from 'src/pipes/pipes.module';
import { TabBulletinDayComponent } from './tab-bulletin-day/tab-bulletin-day.component';
import { TranslationService } from 'src/services/translate/translation.service';
import { GdatePipe } from 'src/pipes/gdate.pipe';

@Component({
  selector: 'app-bulletin-form',
  imports: [
    CommonModule,
    PipesModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatIconModule,
    MatDialogModule,
    TabBulletinPropertiesComponent,
    TabBulletinDayComponent,
  ],
  providers: [ConfirmDialogComponent, DynamicButtonComponent, BulletinFormBuilder, GdatePipe],
  templateUrl: './bulletin-form.component.html',
  styleUrl: './bulletin-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulletinFormComponent extends WithForm<IBulletinForm>() {
  public readonly bulletin = input.required<BulletinDto>();
  protected readonly selectedTabIndex = signal<number>(0);
  protected readonly dayTabDateFormat = 'raw: EEE dd.MM';

  private readonly _tabGroup = viewChild(MatTabGroup);
  private readonly _vcRef = inject(ViewContainerRef);

  public constructor(
    @Inject(IS_MOBILE) protected isMobile: boolean,
    private readonly _dialogService: DialogService,
    private readonly _formBuilder: BulletinFormBuilder,
    private readonly _translateService: TranslationService,
    private readonly _datePipe: GdatePipe,
    private readonly _cd: ChangeDetectorRef
  ) {
    super(_formBuilder.form);

    effect(() => {
      const model = this.bulletin();
      this._formBuilder.setFormValues(model);
    });

    effect(() => {
      if (this._tabGroup() && this._vcRef) {
        this.addButtonAddToHeader();
      }
    });
  }

  public containsValidData(): boolean {
    return this._formBuilder.isValid() && this.isReadyToSubmit();
  }

  protected addDay(): void {
    // TODO
    // przed dodaniem nowego dnia zapytaj, czy przenieść na ten dzień jakieś dane/sekcje z dnia poprzedniego
    // jeżeli powstaje nowy dzień i nowy biuletyn, zapytaj czy przenieść dane z poprzedniego biuletynu z ostatniego dnia
    // podczas dodawania biuletyny pobierz ostatni biuletyn i jego ostatni dzień, jeżeli istnieje
    //
    const newIndex = this._formBuilder.days.length;
    this._formBuilder.addNewDay();
    this.selectedTabIndex.set(newIndex + 1);
  }

  protected async confirmAndRemoveTab(index: number): Promise<void> {
    const day = this._formBuilder.days.at(index) as FormGroup<IBulletinDayForm>;
    if (!day) {
      return;
    }

    this._dialogService
      .confirm({
        message: {
          text: 'Bulletin/Form/DeleteDayConfirmText',
          interpolateParams: {
            dayTitle: this.getDayTitle(day, index),
          },
        },
        noBtnText: 'Shared/BtnCancel',
        yesBtnText: 'Shared/BtnDelete',
      } satisfies IDialogSettings)
      .then((result: boolean) => {
        if (result === true) {
          this._formBuilder.days.removeAt(index);
          if (this.selectedTabIndex() >= this._formBuilder.days.length) {
            this.selectedTabIndex.set(this._formBuilder.days.length);
          }
        }
      });
  }

  protected getDayTitle(day: FormGroup<IBulletinDayForm>, index: number): string {
    let dayTitle = this._datePipe.transform(day.controls.date.value, this.dayTabDateFormat);
    if ((dayTitle?.length ?? 0) > 0) {
      return dayTitle!;
    }

    dayTitle = day.controls.title.value;
    if ((dayTitle?.length ?? 0) > 0) {
      return dayTitle!;
    }

    return this._translateService.get('Bulletin/Form/TabBulletinDay/EmptyDate', {
      dayIndex: index + 1,
    });
  }

  protected onTabChange(event: MatTabChangeEvent): void {
    this._cd.detectChanges();
  }

  private addButtonAddToHeader(): void {
    const header = document.querySelector('.mat-mdc-tab-header');
    if (!header) {
      return;
    }
    const buttonRef = this._vcRef.createComponent(DynamicButtonComponent);
    buttonRef.setInput('label', 'Bulletin/Form/BtnAdd');
    buttonRef.instance.clicked.subscribe(() => {
      this.addDay();
    });
    header.appendChild(buttonRef.location.nativeElement);
  }
}
