import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export abstract class Empty implements OnDestroy {
  public abstract ngOnDestroy(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = Empty> = new (...args: any[]) => T;

export function WithUnsubscribeOnDestroy<T extends Constructor = Constructor<Empty>>(Base: T = Empty as T) {
  return class extends Base implements OnDestroy {
    private _subscriptions: Subscription = new Subscription();

    public ngOnDestroy(): void {
      const baseOnDestroy: () => void = super['ngOnDestroy'];
      if (baseOnDestroy) {
        baseOnDestroy.bind(this)();
      }
      this.unsubscribe();
    }

    public unsubscribe() {
      this._subscriptions.unsubscribe();
      this._subscriptions = new Subscription();
    }

    public registerSubscription(subscription: Subscription) {
      this._subscriptions.add(subscription);
    }
  };
}
