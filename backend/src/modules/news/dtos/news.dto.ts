import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetNewsDto {}

export class GetNewsResponseDto implements IResponse<GetNewsDto> {
  public readonly data: GetNewsDto;
  public readonly message?: string | undefined;

  public constructor(data: GetNewsDto) {
    this.data = data;
    this.message = events.news.retrieved;
  }
}
