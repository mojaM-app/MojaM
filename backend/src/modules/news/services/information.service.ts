import { BaseService } from '@modules/common';
import { GetInformationDto } from '@modules/news';
import { Service } from 'typedi';

@Service()
export class InformationService extends BaseService {
  public async get(): Promise<GetInformationDto> {
    return await new Promise(resolve => {
      resolve({} satisfies GetInformationDto);
    });
  }
}
