import { TestBed } from '@angular/core/testing';

import { CommunityService } from './community.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS]
    });
    service = TestBed.inject(CommunityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
