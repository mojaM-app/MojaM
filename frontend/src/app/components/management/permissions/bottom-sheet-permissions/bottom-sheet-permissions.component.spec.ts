import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheetPermissionsComponent } from './bottom-sheet-permissions.component';

describe('BottomSheetPermissionsComponent', () => {
  let component: BottomSheetPermissionsComponent;
  let fixture: ComponentFixture<BottomSheetPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetPermissionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomSheetPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
