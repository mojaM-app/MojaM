import { TestBed } from '@angular/core/testing';

import { AnnouncementsListService } from './announcements-list.service';

describe('AnnouncementsListService', () => {
  let service: AnnouncementsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnouncementsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
