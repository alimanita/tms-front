import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeader } from '@shared';

import { ReportsReportsPurchasesReport } from './purchases-report';

describe('ReportsReportsPurchasesReport', () => {
  let component: ReportsReportsPurchasesReport;
  let fixture: ComponentFixture<ReportsReportsPurchasesReport>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PageHeader]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsReportsPurchasesReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
