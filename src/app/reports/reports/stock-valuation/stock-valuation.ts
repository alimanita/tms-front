import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';


interface PlaqueBlocStock {
  idPlaque: number;
  codePlaque: string;
  designationPlaque: string;
  epaisseur: number;
  finition: string | null;
  longueur: number;
  largeur: number;
  surface: number;
  stockDisponible: number;
  surfaceTotaleStock: number;
}

interface StockBlocRapport {
  idBloc: number;
  codeBloc: string;
  designationBloc: string;
  typeMateriau: string;
  longueur: number;
  largeur: number;
  hauteur: number;
  poids: number;
  plaquesEnStock: PlaqueBlocStock[];
  nombreTotalPlaques: number;
  surfaceTotaleEnStock: number;
  expanded?: boolean;
}
//interfaces
interface StockGranitRapport {
  codeArticle: string;
   longueur: number;
  largeur: number;

  designation: string;
  epaisseur: number;
  finition: string;
  typeMateriau: string;
  stockDisponible: number;
  surface: number;
  surfaceTotaleStock: number;
}

@Component({
  selector: 'app-reports-reports-stock-valuation',
  imports: [CommonModule],
  templateUrl: './stock-valuation.html',
  styleUrl: './stock-valuation.scss'
})
export class ReportsReportsStockValuation implements OnInit {

  readonly ID_ENTREPRISE = getEntrepriseId()

  activeTab = signal<'blocs' | 'granit'>('blocs');
  loading = signal(false);

  blocsRapport = signal<StockBlocRapport[]>([]);
  granitRapport = signal<StockGranitRapport[]>([]);

  // Totaux blocs
  totalBlocsAvecStock = computed(() => this.blocsRapport().length);
  totalPlaquesEnStock = computed(() =>
    this.blocsRapport().reduce((s, b) => s + b.nombreTotalPlaques, 0));
  totalSurfaceEnStock = computed(() =>
    this.blocsRapport().reduce((s, b) => s + b.surfaceTotaleEnStock, 0));

  // Groupement granit par matériau
  granitGrouped = computed(() => {
    const map = new Map<string, StockGranitRapport[]>();
    for (const p of this.granitRapport()) {
      const key = p.typeMateriau ?? 'Autre';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBlocsRapport();
    this.loadGranitRapport();
  }

  loadBlocsRapport() {
    this.loading.set(true);
    const url = `${environment.baseUrl}/articles/rapports/stock-blocs`
              + `?idEntreprise=${this.ID_ENTREPRISE}`;
    this.http.get<StockBlocRapport[]>(url).subscribe({
      next: data => {
        this.blocsRapport.set(data.map(b => ({ ...b, expanded: false })));
        this.loading.set(false);
      },
      error: err => { console.error(err); this.loading.set(false); }
    });
  }

  loadGranitRapport() {
    const url = `${environment.baseUrl}/articles/rapports/stock-granit`
              + `?idEntreprise=${this.ID_ENTREPRISE}`;
    this.http.get<StockGranitRapport[]>(url).subscribe({
      next: data => this.granitRapport.set(data),
      error: err => console.error(err)
    });
  }

  toggleBloc(bloc: StockBlocRapport) {
    bloc.expanded = !bloc.expanded;
    // force signal update
    this.blocsRapport.update(list => [...list]);
  }

  epaisseurLabel(ep: number | null): string {
    if (!ep) return '—';
    return `${ep} cm`;
  }

  granitMateriauKeys(): string[] {
    return Array.from(this.granitGrouped().keys());
  }

  granitByMateriau(key: string): StockGranitRapport[] {
    return this.granitGrouped().get(key) ?? [];
  }

  totalSurfaceGranit(key: string): number {
    return this.granitByMateriau(key)
      .reduce((s, p) => s + (p.surfaceTotaleStock ?? 0), 0);
  }
}
