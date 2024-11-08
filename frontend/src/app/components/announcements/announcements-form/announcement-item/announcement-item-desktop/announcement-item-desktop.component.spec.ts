import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementItemDesktopComponent } from './announcement-item-desktop.component';

describe('AnnouncementItemDesktopComponent', () => {
  let component: AnnouncementItemDesktopComponent;
  let fixture: ComponentFixture<AnnouncementItemDesktopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementItemDesktopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementItemDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
