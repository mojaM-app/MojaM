import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetRegulationsResponseDto implements IResponse<string> {
  data: string;
  message?: string | undefined;

  constructor(data: string) {
    this.data = data;
    this.message = events.community.regulations.retrieved;
  }
}
