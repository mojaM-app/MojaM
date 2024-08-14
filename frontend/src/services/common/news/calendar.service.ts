import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';
import { HttpClientService } from '../httpClient.service';

@Injectable({
  providedIn: 'root',
})
export class CalendarService extends BaseService {
  public constructor(private _httpClient: HttpClientService) {
    super();
  }
}
