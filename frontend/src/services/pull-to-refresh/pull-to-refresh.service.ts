/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, signal, WritableSignal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IRouteData } from 'src/core/interfaces/common/route.data';

@Injectable({ providedIn: 'root' })
export class PullToRefreshService {
  private readonly _refresh = signal<boolean>(false);
  public readonly refresh = this._refresh.asReadonly();

  private _currentRouteData: WritableSignal<IRouteData> = signal({});

  public constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      const snapshot = this.getDeepestChild(this._activatedRoute.snapshot);
      this._currentRouteData.set(snapshot.data || {});
    });
  }

  public isPullToRefreshEnabled(): boolean {
    return this._currentRouteData()?.pullToRefresh === true;
  }

  public emitRefresh(): void {
    this._refresh.set(true);
  }

  private getDeepestChild(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot;
  }
}
