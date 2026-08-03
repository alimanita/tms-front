import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeader } from '@shared';

import { ReportsReportsStockValuation } from './stock-valuation';

describe('ReportsReportsStockValuation', () => {
  let component: ReportsReportsStockValuation;
  let fixture: ComponentFixture<ReportsReportsStockValuation>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PageHeader]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsReportsStockValuation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
