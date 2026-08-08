import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse } from '../../fleet.service';
import { isAdminRole } from 'app/core/authentication/helpers';


import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FormsModule, MatIconModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss'],
})
export class VehicleListComponent implements OnInit {
  allVehicules: VehiculeResponse[] = [];
  vehicules: VehiculeResponse[] = [];
  
  searchText = '';
  selectedStatut = '';
  selectedCarburant = '';
  selectedActif = '';
  
  loading = false;
  isAdmin = false;
  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { 
    this.isAdmin = isAdminRole();
    this.load();
   }

  load(): void {
    this.loading = true;
    this.fleetService.getVehicules({ page: 0, size: 2000 }).subscribe({
      next: (page: any) => {
        this.allVehicules = page.content ?? page;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement véhicules', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allVehicules];

    if (this.searchText) {
      const lowerSearch = this.searchText.toLowerCase();
      filtered = filtered.filter(v => 
        v.immatriculation?.toLowerCase().includes(lowerSearch) ||
        v.marque?.toLowerCase().includes(lowerSearch) ||
        v.modele?.toLowerCase().includes(lowerSearch) ||
        v.reference?.toLowerCase().includes(lowerSearch)
      );
    }

    if (this.selectedStatut) {
      filtered = filtered.filter(v => v.statut === this.selectedStatut);
    }

    if (this.selectedCarburant) {
      filtered = filtered.filter(v => v.typeCarburant === this.selectedCarburant);
    }

    if (this.selectedActif !== '') {
      const isActif = this.selectedActif === 'true';
      filtered = filtered.filter(v => v.actif === isActif);
    }

    this.vehicules = filtered;
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatut = '';
    this.selectedCarburant = '';
    this.selectedActif = '';
    this.applyFilters();
  }

  goAdd(): void { this.router.navigate(['/fleet/vehicules/new']); }

  goEdit(v: VehiculeResponse): void { this.router.navigate([`/fleet/vehicules/${v.id}/edit`]); }

  goFuel(v: VehiculeResponse): void {
    this.router.navigate(['/fleet/fuel-fillings'], { queryParams: { vehiculeId: v.id } });
  }

  updateStatut(v: VehiculeResponse, statut: string): void {
    this.fleetService.updateStatut(v.id, statut).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  statutClass(statut?: string): string {
    return ({
      DISPONIBLE:   'badge--green',
      EN_SERVICE:   'badge--blue',
      HORS_SERVICE: 'badge--red',
    } as any)[statut ?? ''] ?? 'badge--grey';
  }
  toggle(v: VehiculeResponse): void {
  this.fleetService.toggleVehicleActif(v.id).subscribe({
    next: () => this.load(),
    error: () =>
      this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
  });
}
}