import { Routes } from '@angular/router';
import { ReportsReportsSalesReport } from './reports/sales-report/sales-report';
import { ReportsReportsPurchasesReport } from './reports/purchases-report/purchases-report';
import { ReportsReportsStockValuation } from './reports/stock-valuation/stock-valuation';
import { ReportsReportsFinancialReport } from './reports/financial-report/financial-report';
import { ReportsIndex } from './raport-index/reports-index';
import { ClientBalancesComponent } from './reports/balances-report/client-balances.component';
import { ReportsReportsRetenueClients } from './reports/retenue-clients/retenue-clients';
import { ReportsReportsTvaSurVente } from './reports/tva-sur-vente/tva-sur-vente';
import { MaintenanceReportComponent } from './reports/maintenance-report/maintenance-report';
import { MissionsReportComponent } from './reports/missions-report/missions-report';
import { AmazonReportComponent } from './reports/amazon-report/amazon-report';
import { FinanceStatsComponent } from './reports/finance-stats/finance-stats';
import { ChauffeurReportComponent } from './reports/chauffeur-report/chauffeur-report';

import { TvaReportComponent } from './tva-report/tva-report.component';

export const routes: Routes = [
  { path: '', component: ReportsIndex },
  { path: 'sales-report', component: ReportsReportsSalesReport },
  { path: 'sales-report-by-article', component: ReportsReportsPurchasesReport },
  { path: 'sales-report-by-tva', component: ReportsReportsTvaSurVente },
  { path: 'sales-report-retenue', component: ReportsReportsRetenueClients },
  { path: 'purchases-report', component: ReportsReportsPurchasesReport },
  { path: 'stock-valuation', component: ReportsReportsStockValuation },
  { path: 'financial-report', component: ReportsReportsFinancialReport },
  { path: 'client-balances', component: ClientBalancesComponent },
  { path: 'maintenance-report', component: MaintenanceReportComponent },
  { path: 'missions-report', component: MissionsReportComponent },
  { path: 'amazon-report', component: AmazonReportComponent },
  { path: 'finance-stats', component: FinanceStatsComponent },
  { path: 'tva-report', component: TvaReportComponent },
  { path: 'chauffeur-report', component: ChauffeurReportComponent },
];
