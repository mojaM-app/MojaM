import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionsTreeComponent } from './permissions-tree.component';

describe('PermissionsTreeComponent', () => {
  let component: PermissionsTreeComponent;
  let fixture: ComponentFixture<PermissionsTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionsTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionsTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
