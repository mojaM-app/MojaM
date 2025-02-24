import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionExpiredSnackbarComponent } from './session-expired-snackbar.component';

describe('RefreshSessionSnackbarComponent', () => {
  let component: SessionExpiredSnackbarComponent;
  let fixture: ComponentFixture<SessionExpiredSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionExpiredSnackbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpiredSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
