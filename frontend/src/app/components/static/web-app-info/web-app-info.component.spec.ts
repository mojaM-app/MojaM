import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAppInfoComponent } from './web-app-info.component';

describe('WebAppInfoComponent', () => {
  let component: WebAppInfoComponent;
  let fixture: ComponentFixture<WebAppInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebAppInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebAppInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
