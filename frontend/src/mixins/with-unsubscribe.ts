/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Constructor, Empty } from "./shared.mixin";

export function WithUnsubscribe<T extends Constructor<Empty>>(Base: T = Empty as T) {
  return class extends Base implements OnDestroy {
    private _subscriptions: Subscription = new Subscription();

    public ngOnDestroy(): void {
      this.unsubscribe();
    }

    public unsubscribe(): void {
      this._subscriptions.unsubscribe();
      this._subscriptions = new Subscription();
    }

    public addSubscription(subscription: Subscription): void {
      this._subscriptions.add(subscription);
    }
  }
}
