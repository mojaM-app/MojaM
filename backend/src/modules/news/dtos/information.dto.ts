import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetInformationDto {}

export class GetInformationResponseDto implements IResponse<GetInformationDto> {
  public readonly data: GetInformationDto;
  public readonly message?: string | undefined;

  public constructor(data: GetInformationDto) {
    this.data = data;
    this.message = events.news.information.retrieved;
  }
}
