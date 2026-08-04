import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';

interface AmazonStatsDto {
  expensesByMonth:    Record<string, number>;
  expensesBySupplier: Record<string, number>;
}

const MONTH_LABELS: Record<string, string> = {
  '1':  'Janvier',   '2': 'Février',  '3': 'Mars',
  '4':  'Avril',     '5': 'Mai',      '6': 'Juin',
  '7':  'Juillet',   '8': 'Août',     '9': 'Septembre',
  '10': 'Octobre',  '11': 'Novembre','12': 'Décembre',
};

@Component({
  selector: 'app-reports-amazon-report',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './amazon-report.html',
  styleUrl: './amazon-report.scss'
})
export class AmazonReportComponent implements OnInit {

  loading  = signal(true);
  error    = signal<string | null>(null);
  rawStats = signal<AmazonStatsDto | null>(null);

  depensesParMois = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    return Object.entries(stats.expensesByMonth ?? {})
      .map(([key, montant]) => ({
        mois:   MONTH_LABELS[key] ?? `Mois ${key}`,
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

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<AmazonStatsDto>(`${environment.baseUrl}/fleet/rapports/amazon/stats`)
      .subscribe({
        next: data => { this.rawStats.set(data); this.loading.set(false); },
        error: err  => { this.error.set('Erreur lors du chargement des données.'); this.loading.set(false); console.error(err); }
      });
  }

  goBack() { this.router.navigate(['/reports']); }
}
