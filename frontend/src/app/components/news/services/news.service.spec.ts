import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMMON_TEST_IMPORTS,
      providers: COMMON_TEST_PROVIDERS,
    });
    service = TestBed.inject(NewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
