import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeader } from '@shared';

import { ReportsReportsFinancialReport } from './financial-report';

describe('ReportsReportsFinancialReport', () => {
  let component: ReportsReportsFinancialReport;
  let fixture: ComponentFixture<ReportsReportsFinancialReport>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PageHeader]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsReportsFinancialReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
