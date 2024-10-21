import { events } from '@events';
import { AnnouncementsRetrievedEvent, announcementToICurrentAnnouncements, CurrentAnnouncementsRepository, ICurrentAnnouncementsDto } from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isNullOrUndefined } from '@utils';
import Container, { Service } from 'typedi';

@Service()
export class CurrentAnnouncementsService extends BaseService {
  private readonly _repository: CurrentAnnouncementsRepository;

  public constructor() {
    super();
    this._repository = Container.get(CurrentAnnouncementsRepository);
  }

  public async get(currentUserId: number | undefined): Promise<ICurrentAnnouncementsDto | null> {
    const announcement = await this._repository.get();

    if (isNullOrUndefined(announcement)) {
      return null;
    }

    const result = announcementToICurrentAnnouncements(announcement!);

    this._eventDispatcher.dispatch(events.announcements.retrieved, new AnnouncementsRetrievedEvent(result, currentUserId));

    return result;
  }
}
