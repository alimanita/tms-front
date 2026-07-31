import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
  filterChauffeur = '';
  filterVehicule = '';
  filterDateDebut = '';
  filterDateFin = '';
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
  chauffeurs: { id: number; nom: string }[] = [];
  filteredChauffeur: { id: number; nom: string }[] = [];
  showDropdown = false;
  isAdmin = false;
  selectedChauffeurId: number | null = null;
  selectedChauffeurNom = '';
  readonly statut = StatutMission;

  // ── Debounce pour la recherche chauffeur ─────────────────────────────
  private chauffeurInput$ = new Subject<void>();

  constructor(
    private missionService: MissionService,
    private router: Router,
    private chauffeurService: FleetService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
     this.isAdmin = isAdminRole();
    const isAdminOuSuperAdmin = this.authService.hasRole('SUPERADMIN')
      || this.authService.hasRole('ADMIN');

    this.isGestion = isAdminOuSuperAdmin
      || this.authService.hasRole('MANAGER')
      || this.authService.hasRole('VENDEUR');

    this.isChauffeurScope = !this.isGestion;

    // Debounce : une seule requête au max toutes les 300ms pendant la frappe
    this.chauffeurInput$.pipe(
      debounceTime(50),
    ).subscribe(() => this.load());

    this.load();

    if (this.isGestion) {
      this.loadChauffeurs();
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

      if (this.selectedChauffeurId !== null) {
        if ((m as any).chauffeurId !== this.selectedChauffeurId) return false;
      } else if (this.filterChauffeur
        && !(m.chauffeurNom ?? '').toLowerCase().includes(this.filterChauffeur.toLowerCase())) {
        return false;
      }

      if (this.filterVehicule && !(m.vehiculeRef ?? '').toLowerCase().includes(this.filterVehicule.toLowerCase())) return false;
      if (this.filterDateDebut && m.plannedDeparture < this.filterDateDebut) return false;
      if (this.filterDateFin && m.plannedDeparture > this.filterDateFin) return false;
      return true;
    });
  }

  private loadChauffeurs(): void {
    this.chauffeurService.getChauffeurs().subscribe({
      next: list => this.chauffeurs = list,
      error: () => {},
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
  this.missionService.demarrer(m.id).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission démarrée', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors du démarrage', 'Fermer', { duration: 3000 }),
  });
}

cloturer(m: MissionResponse): void {
  this.missionService.cloturer(m.id).subscribe({
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
    this.filterChauffeur = '';
    this.filterVehicule = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.selectedChauffeurId = null;
    this.selectedChauffeurNom = '';
    this.showDropdown = false;
    this.onFilterChange();
  }

  onChauffeurInput(): void {
    if (this.selectedChauffeurId !== null && this.filterChauffeur !== this.selectedChauffeurNom) {
      this.selectedChauffeurId = null;
    }

    const term = this.filterChauffeur.trim().toLowerCase();
    this.filteredChauffeur = term
      ? this.chauffeurs.filter(c => c.nom.toLowerCase().includes(term))
      : this.chauffeurs;

    this.showDropdown = true;
    this.pageIndex = 0;
    this.chauffeurInput$.next();
  }

  selectChauffeur(c: { id: number; nom: string }): void {
    this.selectedChauffeurId = c.id;
    this.selectedChauffeurNom = c.nom;
    this.filterChauffeur = c.nom;
    this.showDropdown = false;
    this.onFilterChange();
  }

  clearChauffeurFilter(): void {
    this.selectedChauffeurId = null;
    this.selectedChauffeurNom = '';
    this.filterChauffeur = '';
    this.filteredChauffeur = this.chauffeurs;
    this.onFilterChange();
  }

  hideDropdown(): void {
    setTimeout(() => (this.showDropdown = false), 150);
  }
}