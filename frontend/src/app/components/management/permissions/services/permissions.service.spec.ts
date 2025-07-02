import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../../test-helpers/test-setup';

import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMMON_TEST_IMPORTS,
      providers: COMMON_TEST_PROVIDERS,
    });
    service = TestBed.inject(PermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
