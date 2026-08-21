import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { MissionService } from '../mission.service';
import { MissionResponse, StatutMission } from '../mission.model';
import { FleetService } from '../../fleet.service';
import { AuthService } from '@core';
import { isAdminRole } from 'app/core/authentication/helpers';



@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './mission-list.component.html',
  styleUrls: ['./mission-list.component.scss'],
})
export class MissionListComponent implements OnInit {

  missions: MissionResponse[] = [];
  loading = false;

  isGestion = false;
  isChauffeurScope = false;
  monChauffeurId: number | null = null;

  // ── Filtres ────────────────────────────────────────────────────────────
  filterStatut: StatutMission | '' = '';
  filterDateDebut = '';
  filterDateFin = '';

  // ── Multi-select chauffeur ──────────────────────────────────────────
  chauffeurs: { id: number; nom: string }[] = [];
  selectedChauffeurIds: number[] = [];
  chauffeurSearch = '';
  showChauffeurDropdown = false;

  // ── Multi-select véhicule ───────────────────────────────────────────
  vehicules: { id: number; ref: string }[] = [];
  selectedVehiculeIds: number[] = [];
  vehiculeSearch = '';
  showVehiculeDropdown = false;

  get filteredChauffeurs(): { id: number; nom: string }[] {
    const term = this.chauffeurSearch.trim().toLowerCase();
    return term ? this.chauffeurs.filter(c => c.nom.toLowerCase().includes(term)) : this.chauffeurs;
  }

  get filteredVehicules(): { id: number; ref: string }[] {
    const term = this.vehiculeSearch.trim().toLowerCase();
    return term ? this.vehicules.filter(v => v.ref.toLowerCase().includes(term)) : this.vehicules;
  }

  isChauffeurSelected(id: number): boolean { return this.selectedChauffeurIds.includes(id); }
  isVehiculeSelected(id: number): boolean { return this.selectedVehiculeIds.includes(id); }

  toggleChauffeur(id: number): void {
    const idx = this.selectedChauffeurIds.indexOf(id);
    if (idx >= 0) this.selectedChauffeurIds.splice(idx, 1);
    else this.selectedChauffeurIds.push(id);
    this.onFilterChange();
  }

  toggleVehicule(id: number): void {
    const idx = this.selectedVehiculeIds.indexOf(id);
    if (idx >= 0) this.selectedVehiculeIds.splice(idx, 1);
    else this.selectedVehiculeIds.push(id);
    this.onFilterChange();
  }

  clearChauffeursFilter(): void {
    this.selectedChauffeurIds = [];
    this.chauffeurSearch = '';
    this.onFilterChange();
  }

  clearVehiculesFilter(): void {
    this.selectedVehiculeIds = [];
    this.vehiculeSearch = '';
    this.onFilterChange();
  }

  get chauffeurLabel(): string {
    if (!this.selectedChauffeurIds.length) return 'Tous les chauffeurs';
    return this.selectedChauffeurIds
      .map(id => this.chauffeurs.find(c => c.id === id)?.nom ?? '')
      .filter(Boolean)
      .join(', ');
  }

  get vehiculeLabel(): string {
    if (!this.selectedVehiculeIds.length) return 'Tous les véhicules';
    return this.selectedVehiculeIds
      .map(id => this.vehicules.find(v => v.id === id)?.ref ?? '')
      .filter(Boolean)
      .join(', ');
  }

  readonly statutOptions: { value: StatutMission | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: StatutMission.PLANNED, label: 'Planifiée' },
    { value: StatutMission.IN_PROGRESS, label: 'En cours' },
    { value: StatutMission.COMPLETED, label: 'Terminée' },
    { value: StatutMission.CANCELLED, label: 'Annulée' },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────
  pageIndex = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // ── Sélection ──────────────────────────────────────────────────────────
  selectedRows = new Set<number>();
  allSelected = false;
  isAdmin = false;
  readonly statut = StatutMission;

  // ── Modal Lettre de mission ──────────────────────────────────
  letterModalOpen = false;
  letterLoading   = false;
  letterIsImage   = false;
  letterSafeUrl: SafeUrl | null = null;
  private letterBlobUrl: string | null = null;
  private currentLetterMission: MissionResponse | null = null;

  // ── Totaux calculés sur la page courante ─────────────────────
  get totalRevenue(): number { return this.missions.reduce((s, m) => s + (m.revenue ?? 0), 0); }
  get totalFuel():    number { return this.missions.reduce((s, m) => s + (m.fuelCost ?? 0), 0); }
  get totalToll():    number { return this.missions.reduce((s, m) => s + (m.tollCost ?? 0), 0); }
  get totalOtherExpenses(): number { return this.missions.reduce((s, m) => s + (m.otherExpenses ?? 0), 0); }
  get totalCost():    number { return this.missions.reduce((s, m) => s + (m.totalCost ?? 0), 0); }

  constructor(
    private missionService: MissionService,
    private router: Router,
    private chauffeurService: FleetService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
     this.isAdmin = isAdminRole();
    const isAdminOuSuperAdmin = this.authService.hasRole('SUPERADMIN')
      || this.authService.hasRole('SUPER_ADMIN')
      || this.authService.hasRole('ADMIN');

    this.isGestion = isAdminOuSuperAdmin
      || this.authService.hasRole('MANAGER')
      || this.authService.hasRole('VENDEUR');

    this.isChauffeurScope = !this.isGestion;

    this.load();

    if (this.isGestion) {
      this.loadChauffeurs();
      this.loadVehicules();
    }
  }

  load(): void {
    this.loading = true;

    if (this.isGestion) {
      this.missionService.findAll(this.pageIndex, this.pageSize).subscribe({
        next: page => {
          this.missions = this.applyClientFilters(page.content);
          this.totalPages = page.totalPages;
          this.totalElements = page.totalElements;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Erreur lors du chargement des missions', 'Fermer', { duration: 3000 });
        }
      });
      return;
    }

    this.missionService.findMesMissions().subscribe({
      next: (list) => {
        this.missions = this.applyClientFilters(list);
        this.totalElements = this.missions.length;
        this.totalPages = 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement de vos missions', 'Fermer', { duration: 3000 });
      }
    });
  }

  private applyClientFilters(list: MissionResponse[]): MissionResponse[] {
    return list.filter(m => {
      if (this.filterStatut && m.statut !== this.filterStatut) return false;
      if (this.selectedChauffeurIds.length) {
        if (!m.chauffeurIds || !m.chauffeurIds.some(id => this.selectedChauffeurIds.includes(id))) {
          return false;
        }
      }
      if (this.selectedVehiculeIds.length && !this.selectedVehiculeIds.includes((m as any).vehiculeId)) return false;
      if (this.filterDateDebut && m.plannedDeparture < this.filterDateDebut) return false;
      if (this.filterDateFin && m.plannedDeparture > this.filterDateFin) return false;
      return true;
    });
  }

  private loadChauffeurs(): void {
    // getChauffeursDisponibles() retourne directement un tableau ChauffeurResponse[]
    this.chauffeurService.getChauffeursDisponibles().subscribe({
      next: (list: any[]) => {
        this.chauffeurs = list.map(c => ({
          id: c.id,
          nom: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()
        }));
      },
      error: () => {
        // Fallback: essai avec getChauffeurs paginé
        this.chauffeurService.getChauffeurs({ size: 200 }).subscribe({
          next: (page: any) => {
            const items: any[] = page.content ?? page;
            this.chauffeurs = items.map(c => ({
              id: c.id,
              nom: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()
            }));
          },
          error: () => {}
        });
      }
    });
  }

  private loadVehicules(): void {
    // getVehicules() retourne une page paginée { content: [...] }
    this.chauffeurService.getVehicules({ size: 200 }).subscribe({
      next: (page: any) => {
        const items: any[] = page.content ?? (Array.isArray(page) ? page : []);
        this.vehicules = items.map(v => ({
          id: v.id,
          ref: [v.reference, v.immatriculation].filter(Boolean).join(' — ')
        }));
      },
      error: () => {}
    });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  get startIndex(): number { return this.pageIndex * this.pageSize; }
  get endIndex(): number { return Math.min(this.startIndex + this.pageSize, this.totalElements); }

  toggleRow(id: number): void {
    this.selectedRows.has(id) ? this.selectedRows.delete(id) : this.selectedRows.add(id);
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.allSelected = checked;
    this.selectedRows = checked ? new Set(this.missions.map(m => m.id)) : new Set();
  }

  openAdd(): void { this.router.navigate(['/fleet/missions/new']); }
  openDetail(m: MissionResponse): void { this.router.navigate(['/fleet/missions', m.id]); }
  editMission(m: MissionResponse): void { this.router.navigate(['/fleet/missions', m.id, 'edit']); }

 demarrer(m: MissionResponse): void {
  const input = window.prompt('Kilométrage actuel du véhicule au départ (km) :');
  if (input === null) return; // annulé
  const km = input.trim() ? parseFloat(input) : undefined;
  if (km !== undefined && isNaN(km)) {
    this.snackBar.open('Kilométrage invalide', 'Fermer', { duration: 3000 });
    return;
  }
  this.missionService.demarrer(m.id, km).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission démarrée', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors du démarrage', 'Fermer', { duration: 3000 }),
  });
}

cloturer(m: MissionResponse): void {
  const input = window.prompt('Kilométrage actuel du véhicule au retour (km) :');
  if (input === null) return; // annulé
  const km = input.trim() ? parseFloat(input) : undefined;
  if (km !== undefined && isNaN(km)) {
    this.snackBar.open('Kilométrage invalide', 'Fermer', { duration: 3000 });
    return;
  }
  this.missionService.cloturer(m.id, km).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission clôturée', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors de la clôture', 'Fermer', { duration: 3000 }),
  });
}

annuler(m: MissionResponse): void {
  const motif = window.prompt("Motif de l'annulation :");
  if (!motif) return;
  this.missionService.annuler(m.id, motif).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission annulée', 'Fermer', { duration: 2500 });
    },
    error: () => this.snackBar.open("Erreur lors de l'annulation", 'Fermer', { duration: 3000 }),
  });
}

// supprimer(m: MissionResponse): void {
//   const confirmation = window.confirm(`Supprimer définitivement la mission ${m.reference} ?`);
//   if (!confirmation) return;
//   this.missionService.supprimer(m.id).subscribe({
//     next: () => {
//       this.missions = this.missions.filter(x => x.id !== m.id);
//       this.totalElements--;
//       this.snackBar.open('Mission supprimée', 'Fermer', { duration: 2500 });
//     },
//     error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors de la suppression', 'Fermer', { duration: 3000 }),
//   });
// }

private updateMissionInList(updated: MissionResponse): void {
  const index = this.missions.findIndex(m => m.id === updated.id);
  if (index !== -1) {
    this.missions[index] = updated;
    this.missions = [...this.missions]; // nouvelle référence pour déclencher le re-render
  }
}
  getStatusClass(s: StatutMission): string {
    const map: Record<StatutMission, string> = {
      [StatutMission.PLANNED]: 'status-validee',
      [StatutMission.IN_PROGRESS]: 'status-partiel',
      [StatutMission.COMPLETED]: 'status-livree',
      [StatutMission.CANCELLED]: 'status-annulee',
    };
    return map[s] ?? 'status-validee';
  }

  getStatusLabel(s: StatutMission): string {
    return this.statutOptions.find(o => o.value === s)?.label ?? s;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  resetFilters(): void {
    this.filterStatut = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.selectedChauffeurIds = [];
    this.selectedVehiculeIds = [];
    this.chauffeurSearch = '';
    this.vehiculeSearch = '';
    this.showChauffeurDropdown = false;
    this.showVehiculeDropdown = false;
    this.onFilterChange();
  }

  viewLetter(m: MissionResponse): void {
    if (!m.letterMissionUrl) return;
    this.letterModalOpen = true;
    this.letterLoading = true;
    this.currentLetterMission = m;

    this.missionService.downloadLetterBlob(m.id).subscribe({
      next: (blob) => {
        const contentType = blob.type || 'application/octet-stream';
        this.letterIsImage = contentType.startsWith('image/');

        if (this.letterBlobUrl) {
          window.URL.revokeObjectURL(this.letterBlobUrl);
        }
        const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
        this.letterBlobUrl = url;
        this.letterSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.letterLoading = false;
      },
      error: () => {
        this.letterLoading = false;
        this.letterModalOpen = false;
        this.snackBar.open('Impossible de charger la lettre de mission', 'Fermer', { duration: 3000 });
      }
    });
  }

  closeLetterModal(): void {
    this.letterModalOpen = false;
    if (this.letterBlobUrl) {
      window.URL.revokeObjectURL(this.letterBlobUrl);
      this.letterBlobUrl = null;
    }
    this.letterSafeUrl = null;
    this.currentLetterMission = null;
  }

  downloadCurrentLetter(): void {
    if (!this.currentLetterMission) return;
    this.downloadLetter(this.currentLetterMission);
  }

  downloadLetter(m: MissionResponse): void {
    if (!m.letterMissionUrl) return;
    this.missionService.downloadLetterBlob(m.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lettre_Mission_${m.reference || m.id}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors du téléchargement de la lettre', 'Fermer', { duration: 3000 })
    });
  }

  /** Affiche les noms des chauffeurs tronqués : "Ali Ben" ou "Ali Ben, Sara +1" */
  getChauffeursLabel(m: MissionResponse): string {
    const noms = (m.chauffeursNoms || '').trim();
    if (!noms) return '—';
    const names = noms.split(', ').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return '—';
    if (names.length === 1) return names[0];
    // 2 premiers noms, puis "+N" si plus
    const visible = names.slice(0, 2).join(', ');
    return names.length > 2 ? `${visible} +${names.length - 2}` : visible;
  }

  /** Texte du tooltip : liste numérotée de tous les chauffeurs (si >1) */
  getChauffeursTooltip(m: MissionResponse): string {
    const noms = (m.chauffeursNoms || '').trim();
    if (!noms) return '';
    const names = noms.split(', ').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length <= 1) return '';   // pas de tooltip pour 1 seul
    return names.map((n, i) => `${i + 1}. ${n}`).join('\n');
  }
}