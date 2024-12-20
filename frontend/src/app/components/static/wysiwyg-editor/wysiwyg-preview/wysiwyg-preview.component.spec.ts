import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WysiwygPreviewComponent } from './wysiwyg-preview.component';

describe('WysiwygPreviewComponent', () => {
  let component: WysiwygPreviewComponent;
  let fixture: ComponentFixture<WysiwygPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WysiwygPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WysiwygPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
