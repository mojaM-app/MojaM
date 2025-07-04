import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

import { CurrentAnnouncementsService } from './current-announcements.service';

describe('AnnouncementsService', () => {
  let service: CurrentAnnouncementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMMON_TEST_IMPORTS,
      providers: COMMON_TEST_PROVIDERS,
    });
    service = TestBed.inject(CurrentAnnouncementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
