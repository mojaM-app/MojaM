import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiaconieComponent } from './diaconie.component';

describe('DiaconieComponent', () => {
  let component: DiaconieComponent;
  let fixture: ComponentFixture<DiaconieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiaconieComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiaconieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
