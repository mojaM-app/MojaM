import { events, type IResponse } from '@core';

export interface IGetNewsDto {}

export class GetNewsResponseDto implements IResponse<IGetNewsDto> {
  public readonly data: IGetNewsDto;
  public readonly message?: string | undefined;

  constructor(data: IGetNewsDto) {
    this.data = data;
    this.message = events.news.newsRetrieved;
  }
}
