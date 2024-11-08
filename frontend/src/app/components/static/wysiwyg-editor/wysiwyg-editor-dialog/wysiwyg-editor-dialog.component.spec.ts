import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WysiwygEditorPopupComponent } from './wysiwyg-editor-dialog.component';

describe('WysiwygEditorPopupComponent', () => {
  let component: WysiwygEditorPopupComponent;
  let fixture: ComponentFixture<WysiwygEditorPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WysiwygEditorPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WysiwygEditorPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
