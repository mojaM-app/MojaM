import { TestBed } from '@angular/core/testing';
import { COMMON_TEST_PROVIDERS, COMMON_TEST_IMPORTS } from '../../../../test-helpers/test-setup';

import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMMON_TEST_IMPORTS,
      providers: COMMON_TEST_PROVIDERS,
    });
    service = TestBed.inject(CalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
