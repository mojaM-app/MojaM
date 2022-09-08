import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseService } from '../base.service';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService extends BaseService {
  public constructor(private _http: HttpClient) {
    super();
  }
}