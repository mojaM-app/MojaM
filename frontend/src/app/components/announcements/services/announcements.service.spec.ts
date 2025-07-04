import { TestBed } from '@angular/core/testing';

import { AnnouncementsService } from './announcements.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(AnnouncementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
