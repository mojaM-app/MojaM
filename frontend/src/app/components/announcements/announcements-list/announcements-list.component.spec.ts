import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementsListComponent } from './announcements-list.component';

describe('AnnouncementsListComponent', () => {
  let component: AnnouncementsListComponent;
  let fixture: ComponentFixture<AnnouncementsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
