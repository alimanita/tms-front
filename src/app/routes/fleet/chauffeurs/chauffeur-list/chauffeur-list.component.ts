import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';
import { ChauffeurResponse } from '../chauffeur.model';
import { DocumentDrawerComponent } from '../../documents/document-drawer/document-drawer.component';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
  selector: 'app-chauffeur-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, DocumentDrawerComponent],
  templateUrl: './chauffeur-list.component.html',
  styleUrls: ['./chauffeur-list.component.scss'],
})
export class ChauffeurListComponent implements OnInit {
  chauffeurs: ChauffeurResponse[] = [];
  loading = false;

  isDrawerOpen = false;
  selectedChauffeurId: number | null = null;

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN') ||
           this.authService.hasRole('SUPERADMIN') ||
           this.authService.hasRole('SUPER_ADMIN');
  }

  get isComptable(): boolean {
    return this.authService.hasRole('COMPTABLE');
  }

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fleetService.getChauffeurs().subscribe({
      next: (page: any) => {
        this.chauffeurs = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement chauffeurs', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/chauffeurs/new']); }

  goEdit(c: ChauffeurResponse): void { this.router.navigate([`/fleet/chauffeurs/${c.id}/edit`]); }

  goPayslips(c: ChauffeurResponse): void {
    this.selectedChauffeurId = c.id;
    this.isDrawerOpen = true;
  }

  onDrawerClosed(): void {
    this.isDrawerOpen = false;
    this.selectedChauffeurId = null;
  }

  toggle(c: ChauffeurResponse): void {
    this.fleetService.toggleChauffeurActif(c.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  statutClass(statut?: string): string {
    return ({
      DISPONIBLE: 'badge--green',
      EN_MISSION: 'badge--blue',
      INDISPONIBLE: 'badge--red',
    } as any)[statut ?? ''] ?? 'badge--grey';
  }
}