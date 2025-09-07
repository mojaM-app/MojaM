import {
  Component,
  ViewChild,
  ViewContainerRef,
  Type,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  effect,
  computed,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { PipesModule } from 'src/pipes/pipes.module';

@Component({
  selector: 'app-base-dialog',
  templateUrl: './base-dialog.component.html',
  imports: [MatDialogModule, MatButtonModule, PipesModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDialogComponent {
  protected readonly title = computed(() => this._data?.title ?? 'Shared/Information');

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  private _contentHost: ViewContainerRef | undefined;

  private readonly _data = inject<{
    component: Type<unknown>;
    componentData?: unknown;
    title?: string;
  }>(MAT_DIALOG_DATA);
  private readonly _vcRef = viewChild<ViewContainerRef>('contentHost');

  public constructor() {
    effect(() => {
      if (this._vcRef() && this._contentHost) {
        this._contentHost.clear();
        const componentRef = this._contentHost.createComponent(this._data.component);
        if (this._data.componentData && componentRef.instance) {
          Object.assign(componentRef.instance, this._data.componentData);
        }
      }
    });
  }
}
