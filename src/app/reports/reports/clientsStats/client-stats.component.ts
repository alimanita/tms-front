import {
  Component, Input, OnChanges, SimpleChanges,
  inject, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient }                from '@angular/common/http';
import { MatIconModule }             from '@angular/material/icon';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';

import { ClientAvecScore, ScoreLabel } from '../balances-report/client-balances.models';
import { environment } from 'environments/environment';


// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface BlParPeriode {
  periode    : string;   // 'YYYY-MM' | 'YYYY-WW' | 'YYYY'
  nombreBls  : number;
  totalHt    : number;
  totalTtc   : number;
}

export interface PaiementParPeriode {
  periode         : string;
  nombrePaiements : number;
  montantTotal    : number;
}

export interface BlParEtat {
  etat    : string;
  count   : number;
  totalHt : number;
}

export interface TopArticle {
  nom      : string;
  quantite : number;
  totalHt  : number;
}

export interface ClientStats {
  nombreBlsTotal    : number;
  totalHt           : number;
  totalTtc          : number;
  totalEncaissements: number;
  solde             : number;
  soldeDepart       : number;
  blParMois         : BlParPeriode[];
  blParSemaine      : BlParPeriode[];
  blParAnnee        : BlParPeriode[];
  paiementsParMois  : PaiementParPeriode[];
  blParEtat         : BlParEtat[];
  topArticles       : TopArticle[];
}

// ── Donut segment ─────────────────────────────────────────────────────────────

interface DonutSegment {
  etat       : string;
  count      : number;
  color      : string;
  dashArray  : string;
  dashOffset : string;
}

const ETAT_COLORS: Record<string, string> = {
  VALIDEE  : '#6366f1',
  LIVREE   : '#22c55e',
  EN_COURS : '#f59e0b',
  ANNULEE  : '#ef4444',
  BROUILLON: '#94a3b8',
};
const FALLBACK_COLORS = ['#8b5cf6','#14b8a6','#f97316','#ec4899','#64748b'];

export type Period = 'mois' | 'semaine' | 'annee';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector   : 'app-client-stats',
  standalone : true,
  imports    : [CommonModule, MatIconModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './client-stats.component.html',
  styleUrls  : ['./client-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientStatsComponent implements OnChanges {
@Input({ required: true }) clientId!: number;
@Input({ required: true }) idEntreprise!: number;
  @Input() clientSolde: ClientAvecScore | null = null;

  private http         = inject(HttpClient);


  // ── Signals ──────────────────────────────────────────────────────────────
  stats        = signal<ClientStats | null>(null);
  loading      = signal(false);
  error        = signal<string | null>(null);
  activePeriod = signal<Period>('mois');

  // ── Computed ─────────────────────────────────────────────────────────────

tauxRecouvrement = computed(() => {
  const s = this.stats();
  if (!s) return 0;

  // Dette réelle = ce qu'il devait au départ + ses achats - ses paiements
  const totalDu = Math.abs(s.soldeDepart) + s.totalTtc;
  if (totalDu === 0) return 0;

  const taux = Math.round((s.totalEncaissements / totalDu) * 100);
  return Math.min(100, Math.max(0, taux));
});

  blSeries = computed<BlParPeriode[]>(() => {
    const s = this.stats();
    if (!s) return [];
    switch (this.activePeriod()) {
      case 'semaine': return s.blParSemaine;
      case 'annee'  : return s.blParAnnee;
      default       : return s.blParMois;
    }
  });

  blMax = computed(() =>
    Math.max(1, ...this.blSeries().map(b => b.nombreBls))
  );

  blTotalGlobal = computed(() =>
    this.blSeries().reduce((acc, b) => acc + b.totalTtc, 0)
  );

  paiementsMax = computed(() => {
    const s = this.stats();
    if (!s) return 1;
    return Math.max(1, ...s.paiementsParMois.map(p => p.montantTotal));
  });

  donutSegments = computed<DonutSegment[]>(() => {
    const s = this.stats();
    if (!s || s.blParEtat.length === 0) return [];
    const total       = s.blParEtat.reduce((a, e) => a + e.count, 0);
    const circumf     = 2 * Math.PI * 40;   // r=40
    let   offset      = 0;
    return s.blParEtat.map((e, i) => {
      const pct       = e.count / total;
      const dash      = pct * circumf;
      const color     = ETAT_COLORS[e.etat] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      const seg: DonutSegment = {
        etat      : e.etat,
        count     : e.count,
        color,
        dashArray : `${dash} ${circumf - dash}`,
        dashOffset: `${-offset}`,
      };
      offset += dash;
      return seg;
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

ngOnChanges(changes: SimpleChanges): void {
  if (changes['clientId']) {
    if (this.clientId) {
      this.loadStats(this.clientId);
    } else {
      this.stats.set(null);
    }
  }
}

  // ── API ──────────────────────────────────────────────────────────────────

  private loadStats(clientId: number): void {
    if (!this.idEntreprise) return;
    this.loading.set(true);
    this.error.set(null);
    this.http
      .get<ClientStats>(`${environment.baseUrl}/clients/stats/${clientId}`, {
       params: { idEntreprise: this.idEntreprise },
      })
      .subscribe({
        next : data => { this.stats.set(data);   this.loading.set(false); },
        error: ()   => {
          this.error.set('Impossible de charger les statistiques.');
          this.loading.set(false);
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  setPeriod(p: Period): void { this.activePeriod.set(p); }

  barHeight(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  formatPeriodeLabel(periode: string, mode: Period): string {
    if (!periode) return '';
    if (mode === 'annee') return periode;
    if (mode === 'semaine') {
      // Format: 'YYYY-WW' → 'S23'
      const parts = periode.split('-');
      return parts.length === 2 ? `S${parts[1]}` : periode;
    }
    // mode === 'mois': 'YYYY-MM' → 'Jan', 'Fév'…
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const parts  = periode.split('-');
    if (parts.length === 2) {
      const m = parseInt(parts[1], 10) - 1;
      return months[m] ?? periode;
    }
    return periode;
  }

  scoreLabelClass(label: ScoreLabel): string {
    return ({
      'CRITIQUE': 'badge-critique',
      'ÉLEVÉ'   : 'badge-eleve',
      'MODÉRÉ'  : 'badge-modere',
      'FAIBLE'  : 'badge-faible',
    } as Record<ScoreLabel, string>)[label];
  }
}