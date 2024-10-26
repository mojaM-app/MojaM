import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { AnnouncementsRepository, CreateAnnouncementsReqDto } from '@modules/announcements';
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

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<boolean> {
    if (isNullOrUndefined(reqDto.announcements)) {
      return false;
    }

    const announcementsModel = reqDto.announcements;

    if (isDate(announcementsModel.validFromDate)) {
      const existAnnouncementWithSameDate = await this._announcementsRepository.checkIfExistWithDate(announcementsModel.validFromDate);
      if (existAnnouncementWithSameDate) {
        throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcement.Announcement_With_Given_Date_Already_Exists, [reqDto.announcements.validFromDate!]);
      }
    }

    await this._announcementsRepository.create(reqDto);

    return true;
  }
}
