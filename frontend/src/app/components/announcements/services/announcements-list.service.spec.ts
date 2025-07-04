import { TestBed } from '@angular/core/testing';

import { AnnouncementsListService } from './announcements-list.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

describe('AnnouncementsListService', () => {
  let service: AnnouncementsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(AnnouncementsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
