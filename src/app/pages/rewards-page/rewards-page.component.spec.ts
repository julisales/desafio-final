import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RewardsPageComponent } from './rewards-page.component';

describe('RewardsPageComponent', () => {
  let component: RewardsPageComponent;
  let fixture: ComponentFixture<RewardsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RewardsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
