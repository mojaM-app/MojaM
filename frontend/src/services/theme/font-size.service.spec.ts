import { TestBed } from '@angular/core/testing';

import { FontSizeService } from './font-size.service';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../test-helpers/test-setup';

describe('FontSizeService', () => {
  let service: FontSizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    service = TestBed.inject(FontSizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
