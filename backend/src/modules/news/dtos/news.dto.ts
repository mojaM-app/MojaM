import { IResponse } from '@core';
import { events } from '@events';

export class GetNewsDto {}

export class GetNewsResponseDto implements IResponse<GetNewsDto> {
  public readonly data: GetNewsDto;
  public readonly message?: string | undefined;

  constructor(data: GetNewsDto) {
    this.data = data;
    this.message = events.news.retrieved;
  }
}
