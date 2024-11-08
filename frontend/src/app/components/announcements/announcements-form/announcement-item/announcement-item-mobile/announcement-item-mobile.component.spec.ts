import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementItemMobileComponent } from './announcement-item-mobile.component';

describe('AnnouncementItemMobileComponent', () => {
  let component: AnnouncementItemMobileComponent;
  let fixture: ComponentFixture<AnnouncementItemMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementItemMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementItemMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
