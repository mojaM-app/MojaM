import { TestBed } from '@angular/core/testing';

import { SnackBarService } from './snack-bar.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

describe('SnackBarServiceService', () => {
  let service: SnackBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(SnackBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
