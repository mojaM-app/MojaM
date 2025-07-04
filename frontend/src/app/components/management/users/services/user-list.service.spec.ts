import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../../test-helpers/test-setup';
import { UserListService } from './user-list.service';

describe('UserServiceService', () => {
  let service: UserListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMMON_TEST_IMPORTS,
      providers: COMMON_TEST_PROVIDERS,
    });
    service = TestBed.inject(UserListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
