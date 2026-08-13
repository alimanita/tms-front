import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';

interface AmazonStatsDto {
  expensesByMonth:    Record<string, number>;
  expensesBySupplier: Record<string, number>;
}

type ViewMode = 'mensuel' | 'annuel';

const MONTH_LABELS: Record<string, string> = {
  '1':  'Janvier',   '2': 'Février',  '3': 'Mars',
  '4':  'Avril',     '5': 'Mai',      '6': 'Juin',
  '7':  'Juillet',   '8': 'Août',     '9': 'Septembre',
  '10': 'Octobre',  '11': 'Novembre','12': 'Décembre',
};

@Component({
  selector: 'app-reports-amazon-report',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule],
  templateUrl: './amazon-report.html',
  styleUrl: './amazon-report.scss'
})
export class AmazonReportComponent implements OnInit {

  viewMode = signal<ViewMode>('mensuel');

  // Filtres mensuel
  dateDebut = this.defaultDebut();
  dateFin   = this.todayStr();

  // Filtres annuel
  anDebut = new Date().getFullYear() - 4;
  anFin   = new Date().getFullYear();

  loading  = signal(true);
  error    = signal<string | null>(null);
  rawStats = signal<AmazonStatsDto | null>(null);

  depensesParMois = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    return Object.entries(stats.expensesByMonth ?? {})
      .map(([key, montant]) => ({
        label:  this.viewMode() === 'mensuel' ? (MONTH_LABELS[key] ?? `Mois ${key}`) : `Année ${key}`,
        key:    Number(key),
        montant,
      }))
      .sort((a, b) => a.key - b.key);
  });

  depensesParCategorie = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    return Object.entries(stats.expensesBySupplier ?? {})
      .map(([categorie, montant]) => ({ categorie, montant }))
      .sort((a, b) => b.montant - a.montant);
  });

  totalDepenses = computed(() =>
    this.depensesParMois().reduce((s, i) => s + i.montant, 0)
  );

  maxMontant = computed(() =>
    Math.max(1, ...this.depensesParMois().map(i => i.montant))
  );

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);

    let params: Record<string, string> = { mode: this.viewMode() };
    if (this.viewMode() === 'mensuel') {
      params['debut'] = this.dateDebut;
      params['fin']   = this.dateFin;
    } else {
      params['anDebut'] = String(this.anDebut);
      params['anFin']   = String(this.anFin);
    }

    this.http.get<AmazonStatsDto>(`${environment.baseUrl}/fleet/rapports/amazon/stats`, { params })
      .subscribe({
        next: data => { this.rawStats.set(data); this.loading.set(false); },
        error: err  => { this.error.set('Erreur lors du chargement des données.'); this.loading.set(false); console.error(err); }
      });
  }

  switchMode(m: ViewMode) { this.viewMode.set(m); this.load(); }

  barWidth(val: number): string {
    return Math.round((val / this.maxMontant()) * 100) + '%';
  }

  clearFilters() {
    this.dateDebut = this.defaultDebut();
    this.dateFin   = this.todayStr();
    this.anDebut   = new Date().getFullYear() - 4;
    this.anFin     = new Date().getFullYear();
    this.load();
  }

  goBack() { this.router.navigate(['/reports']); }

  private defaultDebut(): string {
    const d = new Date(); d.setMonth(0); d.setDate(1);
    return d.toISOString().slice(0, 10);
  }
  private todayStr(): string { return new Date().toISOString().slice(0, 10); }
}
