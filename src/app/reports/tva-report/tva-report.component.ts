import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { PageHeader } from 'app/shared/page-header/page-header';

@Component({
  selector: 'app-tva-report',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader],
  templateUrl: './tva-report.component.html',
  styleUrls: ['./tva-report.component.scss']
})
export class TvaReportComponent implements OnInit {
  reportData: any = null;
  loading = true;

  // ── Filtres de période ──
  periodMode: 'all' | 'month' | 'year' = 'month'; // par défaut : mois en cours
  selectedMonth: string = ''; // format YYYY-MM
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  // Tab pour détails
  activeTab: 'deductible' | 'collectee' = 'deductible';

  constructor(private http: HttpClient) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedYear = now.getFullYear();
    this.generateAvailableYears();
  }

  ngOnInit() {
    this.loadData();
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear; i++) {
      this.availableYears.push(i);
    }
  }

  loadData() {
    this.loading = true;
    this.reportData = null; // Réinitialiser les données pour afficher le loader proprement
    
    let params = new HttpParams().set('periodMode', this.periodMode);

    if (this.periodMode === 'month' && this.selectedMonth) {
      const [y, m] = this.selectedMonth.split('-');
      params = params.set('year', y).set('month', m);
    } else if (this.periodMode === 'year' && this.selectedYear) {
      params = params.set('year', this.selectedYear.toString());
    }

    this.http.get<any>(`${environment.baseUrl}/fleet/rapports/tva/global`, { params }).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement rapport global', err);
        this.loading = false;
      }
    });
  }

  onPeriodChange(mode: 'all' | 'month' | 'year') {
    this.periodMode = mode;
    this.loadData();
  }

  onMonthChange() {
    this.loadData();
  }

  onYearChange() {
    this.loadData();
  }

  get periodLabel(): string {
    if (this.periodMode === 'month' && this.selectedMonth) {
      const [y, m] = this.selectedMonth.split('-').map(Number);
      const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                      'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      return `${months[m - 1]} ${y}`;
    }
    if (this.periodMode === 'year') return `Année ${this.selectedYear}`;
    return 'Toutes les périodes';
  }
}
