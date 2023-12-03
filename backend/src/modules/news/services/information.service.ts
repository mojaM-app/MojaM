import { BaseService } from '@modules/common/base.service';
import { GetInformationDto } from '@modules/news/dtos/information.dto';
import { Service } from 'typedi';

@Service()
export class InformationService extends BaseService {
  public async get(): Promise<GetInformationDto> {
    return {};
  }
}
