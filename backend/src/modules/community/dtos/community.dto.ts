import { IResponse, events } from '@core';

export interface ICommunityInfoDto {
  logoUrl?: string;
  email?: string;
  webPage?: string;
  phone?: string;
  address?: string;
}

export interface ICommunityTabDto {
  title: string;
  content: string;
}

export interface IGetCommunityDto {
  info: ICommunityInfoDto;
  tabs: ICommunityTabDto[];
}

export class GetCommunityResponseDto implements IResponse<IGetCommunityDto> {
  public readonly data: IGetCommunityDto;
  public readonly message?: string | undefined;

  constructor(data: IGetCommunityDto) {
    this.data = data;
    this.message = events.community.communityRetrieved;
  }
}
