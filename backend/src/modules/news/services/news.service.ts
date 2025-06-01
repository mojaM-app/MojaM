import { BaseService } from '@modules/common';
import { Service } from 'typedi';
import { GetNewsDto } from '../dtos/news.dto';

@Service()
export class NewsService extends BaseService {
  public async get(): Promise<GetNewsDto> {
    return await new Promise(resolve => {
      resolve({} satisfies GetNewsDto);
    });
  }
}
