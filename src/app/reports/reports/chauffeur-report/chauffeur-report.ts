import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { PageHeader } from 'app/shared/page-header/page-header';

interface ChauffeurItem { id: number; nom: string; typeSalaire: string; valeurSalaire: number; }

interface DetailRow {
  chauffeurId?: number;
  nom?: string;
  date?: string;
  reference?: string;
  revenu: number;
  depense: number;
  salaire: number;
  benefice: number;
  nbMissions: number;
}

interface ChauffeurStatsDto {
  chauffeurId:    number | null;
  chauffeurNom:   string;
  salaire:        number | null;
  typeSalaire:    string | null;
  valeurSalaire:  number | null;
  totalRevenu:    number;
  totalDepense:   number;
  totalSalaire:   number;
  totalBenefice:  number;
  totalMissions:  number;
  details:        DetailRow[];
}

@Component({
  selector: 'app-chauffeur-report',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PageHeader],
  templateUrl: './chauffeur-report.html',
  styleUrl:    './chauffeur-report.scss',
})
export class ChauffeurReportComponent implements OnInit {

  // ── Filtres de période ──
  periodMode: 'all' | 'month' | 'year' = 'month';
  selectedMonth: string = ''; // format YYYY-MM
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  // Filtre chauffeur
  chauffeurs = signal<ChauffeurItem[]>([]);
  selectedId: number | '' = '';

  loading = signal(false);
  error   = signal<string | null>(null);
  stats   = signal<ChauffeurStatsDto | null>(null);

  details = computed(() => this.stats()?.details ?? []);

  constructor(private http: HttpClient, private router: Router) {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.generateAvailableYears();
  }

  ngOnInit() {
    this.loadChauffeurs();
    this.load();
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear; i++) {
      this.availableYears.push(i);
    }
  }

  loadChauffeurs() {
    this.http.get<ChauffeurItem[]>(`${environment.baseUrl}/fleet/rapports/chauffeur/liste`)
      .subscribe({ next: data => this.chauffeurs.set(data), error: () => {} });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('periodMode', this.periodMode);

    if (this.selectedId !== '') {
      params = params.set('chauffeurId', String(this.selectedId));
    }

    if (this.periodMode === 'month' && this.selectedMonth) {
      const [y, m] = this.selectedMonth.split('-');
      params = params.set('year', y).set('month', m);
    } else if (this.periodMode === 'year' && this.selectedYear) {
      params = params.set('year', this.selectedYear.toString());
    }

    this.http.get<ChauffeurStatsDto>(`${environment.baseUrl}/fleet/rapports/chauffeur/stats`, { params })
      .subscribe({
        next: data => { this.stats.set(data); this.loading.set(false); },
        error: err  => { this.error.set('Erreur lors du chargement des données.'); this.loading.set(false); console.error(err); }
      });
  }

  onPeriodChange(mode: 'all' | 'month' | 'year') {
    this.periodMode = mode;
    this.load();
  }

  onMonthChange() { this.load(); }
  onYearChange() { this.load(); }

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

  selectedChauffeur = computed(() => {
    if (this.selectedId === '') return null;
    return this.chauffeurs().find(c => c.id === this.selectedId) ?? null;
  });

  goBack() { this.router.navigate(['/reports']); }
}
