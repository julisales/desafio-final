import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareBannerComponent } from './share-banner.component';

describe('ShareBannerComponent', () => {
  let component: ShareBannerComponent;
  let fixture: ComponentFixture<ShareBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
