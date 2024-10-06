import { Injectable } from '@angular/core';
import { BaseService } from '../common/base.service';
import { HttpClientService } from '../common/httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class CalendarService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }
}
