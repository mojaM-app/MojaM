import { CreateAnnouncementsReqDto } from '@modules/announcements';
import { BaseService } from '@modules/common';
import { Service } from 'typedi';

@Service()
export class AnnouncementsService extends BaseService {
  public async create(reqDto: CreateAnnouncementsReqDto): Promise<boolean> {
    return true;
  }
}
