import { TestBed } from '@angular/core/testing';

import { UserProfileService } from './user-profile.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../../test-helpers/test-setup';

describe('UserProfileService', () => {
  let service: UserProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(UserProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
