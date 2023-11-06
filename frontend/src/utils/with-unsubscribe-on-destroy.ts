import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

export class Empty {}
export type Constructor<T = Empty> = new (...args: any[]) => T;

export function WithUnsubscribeOnDestroy<
  T extends Constructor = Constructor<Empty>,
>(Base: T = Empty as T) {
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
