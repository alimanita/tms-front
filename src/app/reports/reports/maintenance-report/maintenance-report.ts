import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeader } from 'app/shared/page-header/page-header';
import { CarburantAnnuelDto, CarburantMensuelDto, FleetService, MaintenanceAnnuelleDto, MaintenanceDetailDto, MaintenanceMensuelleDto, SyntheseEntretiensDto } from 'fleet/fleet.service';


type ActiveTab = 'entretiens' | 'carburant';
type ViewMode  = 'mensuel' | 'annuel';

@Component({
  selector: 'app-maintenance-report',
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    PageHeader,
  ],
  templateUrl: './maintenance-report.html',
  styleUrl:    './maintenance-report.scss',
})
export class MaintenanceReportComponent implements OnInit {

  // ── Tabs & View Mode ──────────────────────────────────────────────────────
  activeTab  = signal<ActiveTab>('entretiens');
  viewMode   = signal<ViewMode>('mensuel');

  // ── Filtres ───────────────────────────────────────────────────────────────
  entityType = '';  // '' | 'VEHICLE' | 'MACHINE'
  dateDebut  = this.defaultDebut();
  dateFin    = this.todayStr();
  anDebut    = new Date().getFullYear() - 4;
  anFin      = new Date().getFullYear();

  // ── État ──────────────────────────────────────────────────────────────────
  loading = signal(false);

  // Entretiens
  entretiensMensuel  = signal<MaintenanceMensuelleDto[]>([]);
  entretiensAnnuel   = signal<MaintenanceAnnuelleDto[]>([]);
  entretiensDetail   = signal<MaintenanceDetailDto[]>([]);
  synthese           = signal<SyntheseEntretiensDto | null>(null);

  // Carburant
  carburantMensuel   = signal<CarburantMensuelDto[]>([]);
  carburantAnnuel    = signal<CarburantAnnuelDto[]>([]);

  // ── Computed : max pour barres ────────────────────────────────────────────
  maxEntretiensMois = computed(() =>
    Math.max(1, ...this.entretiensMensuel().map(d => d.coutTotal))
  );
  maxCarburantMois = computed(() =>
    Math.max(1, ...this.carburantMensuel().map(d => d.coutTotal))
  );
  maxEntretiensAn = computed(() =>
    Math.max(1, ...this.entretiensAnnuel().map(d => d.coutTotal))
  );
  maxCarburantAn = computed(() =>
    Math.max(1, ...this.carburantAnnuel().map(d => d.coutTotal))
  );

  constructor(private fleet: FleetService, private router: Router) {}

  ngOnInit() { this.load(); }

  // ── Chargement principal ──────────────────────────────────────────────────
  load() {
    this.loading.set(true);
    const tab  = this.activeTab();
    const mode = this.viewMode();

    if (tab === 'entretiens') {
      if (mode === 'mensuel') {
        this.loadEntretiensMensuel();
      } else {
        this.loadEntretiensAnnuel();
      }
      this.loadSynthese();
    } else {
      if (mode === 'mensuel') {
        this.loadCarburantMensuel();
      } else {
        this.loadCarburantAnnuel();
      }
    }
  }

  private loadEntretiensMensuel() {
    this.fleet.getRapportEntretiensMensuel({
      entityType: this.entityType || undefined,
      debut: this.dateDebut,
      fin:   this.dateFin,
    }).subscribe({
      next: (data:any)  => {
        this.entretiensMensuel.set(data);
        this.loadEntretiensDetail();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadEntretiensAnnuel() {
    this.fleet.getRapportEntretiensAnnuel({
      entityType: this.entityType || undefined,
      anDebut: this.anDebut,
      anFin:   this.anFin,
    }).subscribe({
      next: (data:any) => { this.entretiensAnnuel.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadEntretiensDetail() {
    this.fleet.getRapportEntretiensDetail({
      entityType: this.entityType || undefined,
      debut: this.dateDebut,
      fin:   this.dateFin,
    }).subscribe({
      next: (data:any) => this.entretiensDetail.set(data),
    });
  }

  private loadSynthese() {
    this.fleet.getRapportEntretiensSynthese({
      entityType: this.entityType || undefined,
      debut: this.dateDebut,
      fin:   this.dateFin,
    }).subscribe({
      next: (data:any) => this.synthese.set(data),
    });
  }

  private loadCarburantMensuel() {
    this.fleet.getRapportCarburantMensuel({
      debut: this.dateDebut,
      fin:   this.dateFin,
    }).subscribe({
      next: (data:any) => { this.carburantMensuel.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadCarburantAnnuel() {
    this.fleet.getRapportCarburantAnnuel({
      anDebut: this.anDebut,
      anFin:   this.anFin,
    }).subscribe({
      next: (data:any) => { this.carburantAnnuel.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Événements UI ─────────────────────────────────────────────────────────
  switchTab(t: ActiveTab)  { this.activeTab.set(t);  this.load(); }
  switchMode(m: ViewMode)  { this.viewMode.set(m);   this.load(); }
  clearFilters() {
    this.entityType = '';
    this.dateDebut  = this.defaultDebut();
    this.dateFin    = this.todayStr();
    this.anDebut    = new Date().getFullYear() - 4;
    this.anFin      = new Date().getFullYear();
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  barWidth(val: number, max: number): string {
    return Math.round((val / max) * 100) + '%';
  }

  pctLabour(row: MaintenanceMensuelleDto | MaintenanceAnnuelleDto): number {
    if (!row.coutTotal) return 0;
    return Math.round((row.coutMainOeuvre / row.coutTotal) * 100);
  }

  pctPieces(row: MaintenanceMensuelleDto | MaintenanceAnnuelleDto): number {
    if (!row.coutTotal) return 0;
    return Math.round((row.coutPieces / row.coutTotal) * 100);
  }

  entityTypeLabel(t: string): string {
    return t === 'VEHICLE' ? 'Véhicule' : t === 'MACHINE' ? 'Machine' : t;
  }

  prioriteClass(p: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'badge-critical',
      HIGH: 'badge-high',
      NORMAL: 'badge-normal',
      LOW: 'badge-low',
    };
    return map[p] ?? 'badge-normal';
  }

  goBack() { this.router.navigate(['/reports']); }

  private defaultDebut(): string {
    const d = new Date();
    d.setMonth(0); d.setDate(1);
    return d.toISOString().slice(0, 10);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
