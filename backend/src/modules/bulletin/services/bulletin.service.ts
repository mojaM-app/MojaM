import { BaseService, events } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { CreateBulletinReqDto } from '../dtos/create-bulletin.dto';
import { DeleteBulletinReqDto } from '../dtos/delete-bulletin.dto';
import { GetBulletinReqDto, IBulletinDto } from '../dtos/get-bulletin.dto';
import { PublishBulletinReqDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinReqDto } from '../dtos/update-bulletin.dto';
import { BulletinRepository } from '../repositories/bulletin.repository';

@Service()
export class BulletinService extends BaseService {
  private readonly _bulletinRepository: BulletinRepository;

  constructor() {
    super();
    this._bulletinRepository = Container.get(BulletinRepository);
  }

  public async get(reqDto: GetBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinUuid);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound, {
        id: reqDto.bulletinUuid,
      });
    }

    const dto = this.bulletinToIBulletin(bulletin!);

    this._eventDispatcher.dispatch(events.bulletin.bulletinRetrieved, dto);

    return dto;
  }

  public async create(reqDto: CreateBulletinReqDto): Promise<IBulletinDto | null> {
    if (isNullOrUndefined(reqDto.bulletin)) {
      return null;
    }

    const bulletin = await this._bulletinRepository.create(reqDto.bulletin, reqDto.currentUserId!);
    const dto = this.bulletinToIBulletin(bulletin);

    this._eventDispatcher.dispatch(events.bulletin.bulletinCreated, dto);

    return dto;
  }

  public async update(reqDto: UpdateBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound, {
        id: reqDto.bulletinId,
      });
    }

    await this._bulletinRepository.update(bulletin!.id, reqDto.bulletin, reqDto.currentUserId!);
    const updatedBulletin = await this._bulletinRepository.get(bulletin!.id);
    const dto = this.bulletinToIBulletin(updatedBulletin!);

    this._eventDispatcher.dispatch(events.bulletin.bulletinUpdated, dto);

    return dto;
  }

  public async delete(reqDto: DeleteBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound, {
        id: reqDto.bulletinId,
      });
    }

    const dto = this.bulletinToIBulletin(bulletin!);

    await this._bulletinRepository.delete(bulletin!.id);

    this._eventDispatcher.dispatch(events.bulletin.bulletinDeleted, dto);

    return dto;
  }

  public async publish(reqDto: PublishBulletinReqDto): Promise<IBulletinDto | null> {
    const bulletin = await this._bulletinRepository.getByUuid(reqDto.bulletinId);

    if (isNullOrUndefined(bulletin)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound, {
        id: reqDto.bulletinId,
      });
    }

    if (bulletin!.isPublished) {
      return this.bulletinToIBulletin(bulletin!);
    }

    await this._bulletinRepository.publish(bulletin!.id, reqDto.currentUserId!);
    const publishedBulletin = await this._bulletinRepository.get(bulletin!.id);
    const dto = this.bulletinToIBulletin(publishedBulletin!);

    this._eventDispatcher.dispatch(events.bulletin.bulletinPublished, dto);

    return dto;
  }

  private bulletinToIBulletin(bulletin: Bulletin): IBulletinDto {
    return {
      id: bulletin.uuid,
      title: bulletin.title,
      startDate: bulletin.startDate,
      daysCount: bulletin.daysCount,
      state: bulletin.state,
      createdAt: bulletin.createdAt,
      createdBy: bulletin.createdBy.getFirstLastName()!,
      modifiedAt: bulletin.modifiedAt,
      modifiedBy: bulletin.modifiedBy?.getFirstLastName() ?? bulletin.createdBy.getFirstLastName(),
      publishedAt: bulletin.publishedAt,
      publishedBy: bulletin.publishedBy ? bulletin.publishedBy.getFirstLastName() : null,
      days: [], // Will be populated from related entities
      questions: [], // Will be populated from related entities
    } satisfies IBulletinDto;
  }
}
