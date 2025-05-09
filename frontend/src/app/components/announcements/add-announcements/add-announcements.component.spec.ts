import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAnnouncementsComponent } from './add-announcements.component';

describe('AddAnnouncementsComponent', () => {
  let component: AddAnnouncementsComponent;
  let fixture: ComponentFixture<AddAnnouncementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAnnouncementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAnnouncementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
