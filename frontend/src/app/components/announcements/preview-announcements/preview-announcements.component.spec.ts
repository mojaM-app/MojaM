import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewAnnouncementsComponent } from './preview-announcements.component';

describe('PreviewAnnouncementsComponent', () => {
  let component: PreviewAnnouncementsComponent;
  let fixture: ComponentFixture<PreviewAnnouncementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewAnnouncementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewAnnouncementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
