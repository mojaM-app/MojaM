import { COMMUNITY_INFO_URL } from '@config';
import { BaseService, events } from '@core';
import { isNullOrEmptyString } from '@utils';
import { Service } from 'typedi';
import { DEFAULT_COMMUNITY_DATA } from '../constants/default-community-data';
import { IGetCommunityDto } from '../dtos/community.dto';
import { CommunityRetrievedEvent } from '../events/community-retrieved-event';

@Service()
export class CommunityService extends BaseService {
  public async get(currentUserId?: number | undefined): Promise<IGetCommunityDto> {
    let result: IGetCommunityDto;

    if (isNullOrEmptyString(COMMUNITY_INFO_URL)) {
      result = DEFAULT_COMMUNITY_DATA;
    } else {
      try {
        result = await this.fetchCommunityData(COMMUNITY_INFO_URL!);
      } catch (error) {
        console.warn('Failed to fetch community data from external source, using default data:', error);
        result = DEFAULT_COMMUNITY_DATA;
      }
    }

    this._eventDispatcher.dispatch(events.community.communityRetrieved, new CommunityRetrievedEvent(currentUserId));

    return result;
  }

  private async fetchCommunityData(url: string): Promise<IGetCommunityDto> {
    const fetchTimeout: number = 5000; // 5 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, fetchTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as IGetCommunityDto | null | undefined;
      return {
        info: data?.info ?? {},
        tabs: data?.tabs ?? [],
      } satisfies IGetCommunityDto;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
