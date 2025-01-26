import { events } from '@events';
import { IResponse } from '@interfaces';

export class CommunityInfoDto {
  logoUrl?: string;
  email?: string;
  webPage?: string;
  phone?: string;
  address?: string;
}

export class CommunityTabDto {
  title: string;
  content: string;
}

export class GetCommunityDto {
  info: CommunityInfoDto;
  tabs: CommunityTabDto[];
}

export class GetCommunityResponseDto implements IResponse<GetCommunityDto> {
  public readonly data: GetCommunityDto;
  public readonly message?: string | undefined;

  constructor(data: GetCommunityDto) {
    this.data = data;
    this.message = events.community.communityRetrieved;
  }
}
