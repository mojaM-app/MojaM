import { EventDispatcherService } from '@events/event-dispatcher.service';
import { EventDispatcher } from 'event-dispatch';

export abstract class BaseService {
  protected readonly _eventDispatcher: EventDispatcher;

  constructor() {
    this._eventDispatcher = EventDispatcherService.getEventDispatcher();
  }
}
