import { TestBed } from '@angular/core/testing';

import { DialogService } from './dialog.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../test-helpers/test-setup';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
