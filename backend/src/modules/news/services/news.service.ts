import { BaseService } from '@modules/common';
import { GetNewsDto } from '@modules/news';
import { Service } from 'typedi';

@Service()
export class NewsService extends BaseService {
  public async get(): Promise<GetNewsDto> {
    return await new Promise(resolve => {
      resolve({} satisfies GetNewsDto);
    });
  }
}
