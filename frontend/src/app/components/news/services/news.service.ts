import { Injectable } from '@angular/core';
import { BaseService } from '../../../../services/common/base.service';
import { HttpClientService } from '../../../../services/common/httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class NewsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }
}
