import { BaseService, events } from '@core';
import { Service } from 'typedi';
import { type IGetNewsDto } from '../dtos/news.dto';
import { NewsRetrievedEvent } from '../events/news-retrieved-event';

@Service()
export class NewsService extends BaseService {
  public async get(currentUserId?: number | undefined): Promise<IGetNewsDto> {
    this._eventDispatcher.dispatch(events.news.newsRetrieved, new NewsRetrievedEvent(currentUserId));

    return await new Promise(resolve => {
      resolve({} satisfies IGetNewsDto);
    });
  }
}
