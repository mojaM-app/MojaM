import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import {
  AnnouncementsCreatedEvent,
  AnnouncementsRepository,
  announcementToIAnnouncements,
  CreateAnnouncementsReqDto,
  IAnnouncementsDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isDate, isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';

@Service()
export class AnnouncementsService extends BaseService {
  private readonly _announcementsRepository: AnnouncementsRepository;

  public constructor() {
    super();
    this._announcementsRepository = Container.get(AnnouncementsRepository);
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<IAnnouncementsDto | null> {
    if (isNullOrUndefined(reqDto.announcements)) {
      return null;
    }

    const announcementsModel = reqDto.announcements;

    if (isDate(announcementsModel.validFromDate)) {
      const existAnnouncementWithSameDate = await this._announcementsRepository.checkIfExistWithDate(announcementsModel.validFromDate);
      if (existAnnouncementWithSameDate) {
        throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcement.Announcement_With_Given_Date_Already_Exists, [
          reqDto.announcements.validFromDate!,
        ]);
      }
    }

    const announcements = await this._announcementsRepository.create(reqDto);
    const dto = announcementToIAnnouncements(announcements);

    this._eventDispatcher.dispatch(events.announcements.announcementsCreated, new AnnouncementsCreatedEvent(dto, reqDto.currentUserId));

    return dto;
  }
}
