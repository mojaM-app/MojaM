import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../../test-helpers/test-setup';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS]
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
