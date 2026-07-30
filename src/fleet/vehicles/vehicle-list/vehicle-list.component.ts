import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse } from '../../fleet.service';
import { getRolesFromToken, isAdminRole } from 'app/core/authentication/helpers';


@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss'],
})
export class VehicleListComponent implements OnInit {
  vehicules: VehiculeResponse[] = [];
  loading = false;
isAdmin = false;
  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { 
    this.isAdmin = isAdminRole();
      console.log('isAdmin =', this.isAdmin, 'roles =', getRolesFromToken());
    this.load();
   }

  load(): void {
    this.loading = true;
    this.fleetService.getVehicules().subscribe({
      next: (page: any) => {
        this.vehicules = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement véhicules', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/vehicles/new']); }

  goEdit(v: VehiculeResponse): void { this.router.navigate([`/fleet/vehicles/${v.id}/edit`]); }

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