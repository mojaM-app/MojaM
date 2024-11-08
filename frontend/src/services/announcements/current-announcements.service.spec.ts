import { TestBed } from '@angular/core/testing';

import { CurrentAnnouncementsService } from './current-announcements.service';

describe('AnnouncementsService', () => {
  let service: CurrentAnnouncementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentAnnouncementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
