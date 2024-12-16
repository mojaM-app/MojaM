import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import {
  AnnouncementsCreatedEvent,
  AnnouncementsDeletedEvent,
  AnnouncementsPublishedEvent,
  AnnouncementsRepository,
  AnnouncementsRetrievedEvent,
  AnnouncementStateValue,
  AnnouncementsUpdatedEvent,
  CopyAnnouncementsReqDto,
  CreateAnnouncementItemDto,
  CreateAnnouncementsDto,
  CreateAnnouncementsReqDto,
  DeleteAnnouncementsReqDto,
  GetAnnouncementsReqDto,
  IAnnouncementsDto,
  PublishAnnouncementsReqDto,
  UpdateAnnouncementsReqDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isDate, isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';
import { IAnnouncementItemDto } from '../dtos/get-announcements.dto';
import { Announcement } from '../entities/announcement.entity';

@Service()
export class AnnouncementsService extends BaseService {
  private readonly _announcementsRepository: AnnouncementsRepository;

  public constructor() {
    super();
    this._announcementsRepository = Container.get(AnnouncementsRepository);
  }

  public async get(reqDto: GetAnnouncementsReqDto): Promise<IAnnouncementsDto | null> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    const dto = this.announcementToIAnnouncements(announcements!);

    this._eventDispatcher.dispatch(events.announcements.announcementsRetrieved, new AnnouncementsRetrievedEvent(dto, reqDto.currentUserId!));

    return dto;
  }

  public async create(reqDto: CreateAnnouncementsReqDto): Promise<IAnnouncementsDto | null> {
    if (isNullOrUndefined(reqDto.announcements)) {
      return null;
    }

    const announcementsModel = reqDto.announcements;

    if (isDate(announcementsModel.validFromDate)) {
      const existAnnouncementWithSameDate = await this._announcementsRepository.checkIfExistWithDate(announcementsModel.validFromDate);
      if (existAnnouncementWithSameDate) {
        throw new TranslatableHttpException(
          StatusCode.ClientErrorBadRequest,
          errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists,
          { validFromDate: reqDto.announcements.validFromDate },
        );
      }
    }

    const { id: announcementsId } = await this._announcementsRepository.create(reqDto);
    const announcements = await this._announcementsRepository.get(announcementsId);
    const dto = this.announcementToIAnnouncements(announcements!);

    this._eventDispatcher.dispatch(events.announcements.announcementsCreated, new AnnouncementsCreatedEvent(dto, reqDto.currentUserId!));

    return dto;
  }

  public async update(reqDto: UpdateAnnouncementsReqDto): Promise<IAnnouncementsDto | null> {
    if (isNullOrUndefined(reqDto.announcementsId) || isNullOrUndefined(reqDto.announcements)) {
      return null;
    }

    const announcementsModel = reqDto.announcements;

    if (isDate(announcementsModel.validFromDate)) {
      const existAnnouncementWithSameDate = await this._announcementsRepository.checkIfExistWithDate(
        announcementsModel.validFromDate,
        reqDto.announcementsId,
      );
      if (existAnnouncementWithSameDate) {
        throw new TranslatableHttpException(
          StatusCode.ClientErrorBadRequest,
          errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists,
          { validFromDate: reqDto.announcements.validFromDate },
        );
      }
    }

    const { id: announcementsId } = await this._announcementsRepository.update(reqDto);
    const announcements = await this._announcementsRepository.get(announcementsId);
    const dto = this.announcementToIAnnouncements(announcements!);

    this._eventDispatcher.dispatch(events.announcements.announcementsUpdated, new AnnouncementsUpdatedEvent(dto, reqDto.currentUserId!));

    return dto;
  }

  public async copy(reqDto: CopyAnnouncementsReqDto): Promise<IAnnouncementsDto | null> {
    let announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    const model = new CreateAnnouncementsDto();
    model.title = announcements!.title ?? undefined;
    model.validFromDate = null;
    model.items = (announcements!.items ?? []).map(item => {
      const newItem = new CreateAnnouncementItemDto();
      newItem.content = item.content;
      return newItem;
    });

    const { id: announcementsId } = await this._announcementsRepository.create(new CreateAnnouncementsReqDto(model, reqDto.currentUserId));

    announcements = await this._announcementsRepository.get(announcementsId);

    const dto = this.announcementToIAnnouncements(announcements!);

    this._eventDispatcher.dispatch(events.announcements.announcementsCreated, new AnnouncementsCreatedEvent(dto, reqDto.currentUserId!));

    return dto;
  }

  public async delete(reqDto: DeleteAnnouncementsReqDto): Promise<string | null> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    const relatedData: string[] = await this._announcementsRepository.checkIfCanBeDeleted(announcements!.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        {
          id: announcements?.uuid,
          relatedData,
        },
      );
    }

    await this._announcementsRepository.delete(announcements!, reqDto);

    this._eventDispatcher.dispatch(
      events.announcements.announcementsDeleted,
      new AnnouncementsDeletedEvent(this.announcementToIAnnouncements(announcements!), reqDto.currentUserId!),
    );

    return announcements!.uuid;
  }

  public async publish(reqDto: PublishAnnouncementsReqDto): Promise<boolean> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    if (isNullOrUndefined(announcements?.validFromDate)) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.announcements.Announcements_Without_ValidFromDate_Can_Not_Be_Published,
        {
          id: reqDto.announcementsId,
        },
      );
    }

    if (announcements!.state === AnnouncementStateValue.PUBLISHED) {
      return true;
    }

    const result = await this._announcementsRepository.publish(announcements!, reqDto);

    this._eventDispatcher.dispatch(
      events.announcements.announcementsPublished,
      new AnnouncementsPublishedEvent(this.announcementToIAnnouncements(announcements!), reqDto.currentUserId!),
    );

    return result;
  }

  private announcementToIAnnouncements(announcement: Announcement): IAnnouncementsDto {
    return {
      id: announcement.uuid,
      title: announcement.title ?? undefined,
      state: announcement.state,
      validFromDate: announcement.validFromDate,
      createdBy: announcement.createdBy.getFullName()!,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt ?? announcement.createdAt,
      publishedAt: announcement.publishedAt ?? undefined,
      publishedBy: announcement.publishedBy?.getFullName() ?? undefined,
      items: (announcement.items ?? []).map(
        item =>
          ({
            id: item.id,
            content: item.content,
            createdAt: item.createdAt,
            createdBy: item.createdBy.getFullName()!,
            updatedAt: item.updatedAt ?? item.createdAt,
            updatedBy: item.updatedBy?.getFullName() ?? undefined,
          }) satisfies IAnnouncementItemDto,
      ),
    } satisfies IAnnouncementsDto;
  }
}
