import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService,  } from '../../fleet.service';
import { ChauffeurResponse } from '../chauffeur.model';

@Component({
  selector: 'app-chauffeur-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './chauffeur-list.component.html',
  styleUrls: ['./chauffeur-list.component.scss'],
})
export class ChauffeurListComponent implements OnInit {
  chauffeurs: ChauffeurResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
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