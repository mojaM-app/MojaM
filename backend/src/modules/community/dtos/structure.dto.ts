import { events } from '@events';
import { IResponse } from '@interfaces';

export class GetStructureResponseDto implements IResponse<string> {
  public readonly data: string;
  public readonly message?: string | undefined;

  constructor(data: string) {
    this.data = data;
    this.message = events.community.structure.retrieved;
  }
}
