import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetMeetingsResponseDto implements IResponse<string> {
  data: string;
  message?: string | undefined;

  constructor(data: string) {
    this.data = data;
    this.message = events.community.meetings.retrieved;
  }
}
