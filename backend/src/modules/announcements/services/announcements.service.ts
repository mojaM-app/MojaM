import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import {
  AnnouncementsCreatedEvent,
  AnnouncementsDeletedEvent,
  AnnouncementsRepository,
  AnnouncementStateValue,
  announcementToIAnnouncements,
  CreateAnnouncementsReqDto,
  DeleteAnnouncementsReqDto,
  IAnnouncementsDto,
  PublishAnnouncementsReqDto,
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
        throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcement_With_Given_Date_Already_Exists, [
          reqDto.announcements.validFromDate!,
        ]);
      }
    }

    const { id: announcementsId } = await this._announcementsRepository.create(reqDto);
    const announcements = await this._announcementsRepository.get(announcementsId);
    const dto = announcements === null ? null : announcementToIAnnouncements(announcements);

    this._eventDispatcher.dispatch(events.announcements.announcementsCreated, new AnnouncementsCreatedEvent(dto, reqDto.currentUserId));

    return dto;
  }

  public async delete(reqDto: DeleteAnnouncementsReqDto): Promise<string | null> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.idGuid);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, [reqDto.idGuid!]);
    }

    const relatedData: string[] = await this._announcementsRepository.checkIfCanBeDeleted(announcements!.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [announcements!.uuid].concat(relatedData),
      );
    }

    await this._announcementsRepository.delete(announcements!, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeleted, new AnnouncementsDeletedEvent(announcementToIAnnouncements(announcements!), reqDto.currentUserId));

    return announcements!.uuid;
  }

  public async publish(reqDto: PublishAnnouncementsReqDto): Promise<boolean> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.idGuid);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, [reqDto.idGuid!]);
    }

    if (announcements!.state === AnnouncementStateValue.PUBLISHED) {
      return true;
    }

    return await this._announcementsRepository.publish(announcements!, reqDto);
  }
}
