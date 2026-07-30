import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrdreTravailService } from '../ordre-travail.service';
import { OrdreTravailResponse } from '../ordre-travail.model';
import { EntretienDialogComponent } from '../entretien-dialog/entretien-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../app/core/auth/auth.service';


@Component({
  selector: 'app-entretien-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    EntretienDialogComponent, MatDividerModule, MatMenuModule,
  ],
  templateUrl: './entretien-list.component.html',
  styleUrl: './entretien-list.component.scss',
})
export class EntretienListComponent implements OnInit {
  entretiens = signal<OrdreTravailResponse[]>([]);
  loading    = signal(false);

  pageIndex = 0;
  pageSize  = 10;
  totalPages = 0;
  totalElements = 0;
dateDebutFilter = signal<string>(''); 
dateFinFilter   = signal<string>('');
  isDialogOpen = false;
  otToEdit: OrdreTravailResponse | null = null;
 lockedEntityType: 'VEHICLE' | 'MACHINE' | null = null;
  // ── Filtres (backend) ───────────────────────────────────────────────
  statutFilter = signal<string>('');
  entityTypeFilter = signal<string>('');
  searchQuery = signal<string>('');
  private searchDebounceTimer: any;

  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'PLANNED', label: 'Planifié' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'ON_HOLD', label: 'En attente' },
    { value: 'COMPLETED', label: 'Terminé' },
    { value: 'CANCELLED', label: 'Annulé' },
  ];

  entityTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'VEHICLE', label: 'Véhicule' },
    { value: 'MACHINE', label: 'Machine' },
  ];

get hasActiveFilters(): boolean {
  return !!this.statutFilter() || !!this.entityTypeFilter() || !!this.searchQuery().trim()
      || !!this.dateDebutFilter() || !!this.dateFinFilter();
}

 constructor(
    private ordreTravailService: OrdreTravailService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {
    if (this.authService.hasRole('MECANICIEN')) {
      this.lockedEntityType = 'MACHINE';
    } else if (this.authService.hasRole('CHAUFFEUR')) {
      this.lockedEntityType = 'VEHICLE';
    }
  }


 ngOnInit(): void {
    if (this.lockedEntityType) {
      this.entityTypeFilter.set(this.lockedEntityType);
    }
    this.load();
  }

load(): void {
  this.loading.set(true);
  this.ordreTravailService.findAll(this.pageIndex, this.pageSize, {
    statut: this.statutFilter() || undefined,
    entityType: this.entityTypeFilter() || undefined,
    search: this.searchQuery().trim() || undefined,
    dateDebut: this.dateDebutFilter() || undefined,
    dateFin: this.dateFinFilter() || undefined,
  }).subscribe({
    next: page => {
      this.entretiens.set(page.content);
      this.totalPages = page.totalPages;
      this.totalElements = page.totalElements;
      this.loading.set(false);
    },
    error: () => {
      this.loading.set(false);
      this.snackBar.open('Erreur lors du chargement des entretiens', 'Fermer', { duration: 3000 });
    }
  });
}

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.load();
  }

  // ── Filtres ──────────────────────────────────────────────────────────
  setStatutFilter(value: string): void {
    this.statutFilter.set(value);
    this.pageIndex = 0;
    this.load();
  }

  setEntityTypeFilter(value: string): void {
    this.entityTypeFilter.set(value);
    this.pageIndex = 0;
    this.load();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageIndex = 0;
    // Debounce pour éviter un appel réseau à chaque frappe
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => this.load(), 350);
  }

setDateDebutFilter(value: string): void {
  this.dateDebutFilter.set(value);
  this.pageIndex = 0;
  this.load();
}

setDateFinFilter(value: string): void {
  this.dateFinFilter.set(value);
  this.pageIndex = 0;
  this.load();
}

// ── resetFilters() : ajouter les deux dates ──
resetFilters(): void {
  this.statutFilter.set('');
  this.entityTypeFilter.set(this.lockedEntityType || '');
  this.searchQuery.set('');
  this.dateDebutFilter.set('');
  this.dateFinFilter.set('');
  this.pageIndex = 0;
  this.load();
}

  openDialog(): void {
    this.otToEdit = null;
    this.isDialogOpen = true;
  }

  onDialogClosed(): void {
    this.isDialogOpen = false;
    this.otToEdit = null;
    this.load();
  }

  onEntretienSaved(): void {
    this.isDialogOpen = false;
    this.otToEdit = null;
    this.load();
  }

  demarrer(ot: OrdreTravailResponse): void {
    this.ordreTravailService.demarrer(ot.id).subscribe({
      next: () => { this.snackBar.open('Entretien démarré', 'OK', { duration: 2500 }); this.load(); },
      error: (err) => this.snackBar.open(err?.error?.message || 'Erreur lors du démarrage', 'Fermer', { duration: 3500 }),
    });
  }

  cloturer(ot: OrdreTravailResponse): void {
    if (!confirm(`Clôturer l'entretien ${ot.reference} ?`)) return;
    this.ordreTravailService.cloturer(ot.id).subscribe({
      next: () => { this.snackBar.open('Entretien clôturé', 'OK', { duration: 2500 }); this.load(); },
      error: (err) => this.snackBar.open(err?.error?.message || 'Erreur lors de la clôture', 'Fermer', { duration: 3500 }),
    });
  }

  annuler(ot: OrdreTravailResponse): void {
    if (!confirm(`Annuler l'entretien ${ot.reference} ? Les pièces déjà décomptées seront restockées.`)) return;
    this.ordreTravailService.annuler(ot.id).subscribe({
      next: () => { this.snackBar.open('Entretien annulé', 'OK', { duration: 2500 }); this.load(); },
      error: (err) => this.snackBar.open(err?.error?.message || "Erreur lors de l'annulation", 'Fermer', { duration: 3500 }),
    });
  }

  delete(ot: OrdreTravailResponse): void {
    if (!confirm(`Supprimer définitivement l'entretien ${ot.reference} ?`)) return;
    this.ordreTravailService.delete(ot.id).subscribe({
      next: () => { this.snackBar.open('Entretien supprimé', 'OK', { duration: 2500 }); this.load(); },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3500 }),
    });
  }

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-brouillon',
      PLANNED: 'status-validee',
      IN_PROGRESS: 'status-partiel',
      ON_HOLD: 'status-partiel',
      COMPLETED: 'status-livree',
      CANCELLED: 'status-annulee',
    };
    return map[statut] ?? 'status-brouillon';
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon',
      PLANNED: 'Planifié',
      IN_PROGRESS: 'En cours',
      ON_HOLD: 'En attente',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    };
    return map[statut] ?? statut;
  }

  prioriteClass(priorite: string): string {
    const map: Record<string, string> = {
      LOW: 'priorite-basse',
      NORMAL: 'priorite-normale',
      HIGH: 'priorite-haute',
      CRITICAL: 'priorite-critique',
    };
    return map[priorite] ?? 'priorite-normale';
  }

  modifier(ot: OrdreTravailResponse): void {
    this.otToEdit = ot;
    this.isDialogOpen = true;
  }

  entityIcon(entityType: string): string {
  return entityType === 'MACHINE' ? 'precision_manufacturing' : 'directions_car';
}
}