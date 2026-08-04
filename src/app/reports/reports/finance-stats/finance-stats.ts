import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';

interface FinanceStatsDto {
  monthlyRevenue:          Record<string, number>;
  monthlyExpenses:         Record<string, number>;
  monthlyResult:           Record<string, number>;
  fleetExpensesByCategory: Record<string, number>;
}

const MONTH_LABELS: Record<string, string> = {
  '1':  'Janvier',   '2': 'Février',  '3': 'Mars',
  '4':  'Avril',     '5': 'Mai',      '6': 'Juin',
  '7':  'Juillet',   '8': 'Août',     '9': 'Septembre',
  '10': 'Octobre',  '11': 'Novembre','12': 'Décembre',
};

@Component({
  selector: 'app-reports-finance-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './finance-stats.html',
  styleUrl: './finance-stats.scss'
})
export class FinanceStatsComponent implements OnInit {

  loading  = signal(true);
  error    = signal<string | null>(null);
  rawStats = signal<FinanceStatsDto | null>(null);

  resultatMensuel = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    const allKeys = new Set([
      ...Object.keys(stats.monthlyRevenue  ?? {}),
      ...Object.keys(stats.monthlyExpenses ?? {}),
    ]);
    return [...allKeys]
      .map(key => ({
        mois:           MONTH_LABELS[key] ?? `Mois ${key}`,
        key:            Number(key),
        chiffreAffaires: stats.monthlyRevenue[key]  ?? 0,
        charges:         stats.monthlyExpenses[key] ?? 0,
        resultat:        stats.monthlyResult[key]   ?? 0,
      }))
      .sort((a, b) => a.key - b.key);
  });

  chargesExploitation = computed(() => {
    const stats = this.rawStats();
    if (!stats) return [];
    return Object.entries(stats.fleetExpensesByCategory ?? {})
      .map(([categorie, montant]) => ({ categorie, montant }))
      .sort((a, b) => b.montant - a.montant);
  });

  totalCA       = computed(() => this.resultatMensuel().reduce((s, i) => s + i.chiffreAffaires, 0));
  totalCharges  = computed(() => this.resultatMensuel().reduce((s, i) => s + i.charges, 0));
  totalResultat = computed(() => this.resultatMensuel().reduce((s, i) => s + i.resultat, 0));

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<FinanceStatsDto>(`${environment.baseUrl}/fleet/rapports/finance/stats`)
      .subscribe({
        next: data => { this.rawStats.set(data); this.loading.set(false); },
        error: err  => { this.error.set('Erreur lors du chargement des données.'); this.loading.set(false); console.error(err); }
      });
  }

  goBack() { this.router.navigate(['/reports']); }
}
