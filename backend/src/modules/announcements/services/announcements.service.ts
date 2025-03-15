import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import {
  AnnouncementsCreatedEvent,
  AnnouncementsDeletedEvent,
  AnnouncementsPublishedEvent,
  AnnouncementsRepository,
  AnnouncementsRetrievedEvent,
  AnnouncementStateValue,
  AnnouncementsUpdatedEvent,
  CreateAnnouncementsReqDto,
  DeleteAnnouncementsReqDto,
  GetAnnouncementsReqDto,
  IAnnouncementsDto,
  PublishAnnouncementsReqDto,
  UpdateAnnouncementsReqDto,
} from '@modules/announcements';
import { BaseService } from '@modules/common';
import { isDate, isNullOrUndefined } from '@utils';
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
      throw new BadRequestException(errorKeys.announcements.Announcements_Does_Not_Exist, {
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

    const existAnnouncementWithSameDate = await this._announcementsRepository.checkIfExistWithDate(announcementsModel.validFromDate);
    if (existAnnouncementWithSameDate) {
      throw new BadRequestException(errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists, {
        validFromDate: reqDto.announcements.validFromDate,
      });
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
        throw new BadRequestException(errorKeys.announcements.Announcements_With_Given_ValidFromDate_Already_Exists, {
          validFromDate: reqDto.announcements.validFromDate,
        });
      }
    }

    const announcementsId = await this._announcementsRepository.update(reqDto);
    const announcements = await this._announcementsRepository.get(announcementsId);
    const dto = this.announcementToIAnnouncements(announcements!);

    this._eventDispatcher.dispatch(events.announcements.announcementsUpdated, new AnnouncementsUpdatedEvent(dto, reqDto.currentUserId!));

    return dto;
  }

  public async delete(reqDto: DeleteAnnouncementsReqDto): Promise<boolean> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new BadRequestException(errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    /**
     * Check if the announcement is connected with another data
     * currently, there is no related data
     * if there will be related data in the future, this part should be uncommented
      const relatedData: string[] = await this._announcementsRepository.checkIfCanBeDeleted(announcements!.id);

      if (relatedData.length > 0) {
        throw new ConflictException(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted, {
          id: announcements!.uuid,
          relatedData,
        });
      }
     */

    const result = await this._announcementsRepository.delete(announcements!.id, reqDto);

    this._eventDispatcher.dispatch(
      events.announcements.announcementsDeleted,
      new AnnouncementsDeletedEvent(this.announcementToIAnnouncements(announcements!), reqDto.currentUserId!),
    );

    return result;
  }

  public async publish(reqDto: PublishAnnouncementsReqDto): Promise<boolean> {
    const announcements = await this._announcementsRepository.getByUuid(reqDto.announcementsId);

    if (isNullOrUndefined(announcements)) {
      throw new BadRequestException(errorKeys.announcements.Announcements_Does_Not_Exist, {
        id: reqDto.announcementsId,
      });
    }

    if (isNullOrUndefined(announcements!.validFromDate)) {
      throw new BadRequestException(errorKeys.announcements.Announcements_Without_ValidFromDate_Can_Not_Be_Published, {
        id: reqDto.announcementsId,
      });
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
      createdBy: announcement.createdBy.getFirstLastName()!,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      publishedAt: announcement.publishedAt ?? undefined,
      publishedBy: announcement.publishedBy?.getFirstLastName() ?? undefined,
      items: (announcement.items ?? []).map(
        item =>
          ({
            id: item.id,
            content: item.content,
            createdAt: item.createdAt,
            createdBy: item.createdBy.getFirstLastName()!,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy?.getFirstLastName() ?? undefined,
          }) satisfies IAnnouncementItemDto,
      ),
    } satisfies IAnnouncementsDto;
  }
}
