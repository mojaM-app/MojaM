import { TestBed } from '@angular/core/testing';

import { DiaconieService } from './diaconie.service';

describe('DiaconieService', () => {
  let service: DiaconieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiaconieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
