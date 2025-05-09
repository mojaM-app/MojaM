import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPinComponent } from './reset-pin.component';

describe('ResetPinComponent', () => {
  let component: ResetPinComponent;
  let fixture: ComponentFixture<ResetPinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
