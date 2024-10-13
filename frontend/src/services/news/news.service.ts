import { Injectable } from '@angular/core';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class NewsService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }
}
