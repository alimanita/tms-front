import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PleinCarburantResponse, VehiculeResponse } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fuel-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FormsModule, MatIconModule],
  templateUrl: './fuel-list.component.html',
  styleUrls: ['./fuel-list.component.scss'],
})
export class FuelListComponent implements OnInit {
  allPleins: PleinCarburantResponse[] = [];
  pleins: PleinCarburantResponse[] = [];
  vehicules: VehiculeResponse[]    = [];
  chauffeurs: ChauffeurResponse[]  = [];
  
  selectedVehiculeId?: number | '';
  selectedChauffeurId?: number | '';
  startDate?: string;
  endDate?: string;
  
  loading = false;
proofModalOpen = false;
proofLoading = false;
proofIsImage = false;
proofSafeUrl: SafeUrl | null = null;
currentProofId: number | null = null;
currentProofRef = '';
private currentProofBlobUrl: string | null = null;
  constructor(
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
     private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.fleetService.getVehicules({ size: 1000 }).subscribe({
      next: (page: any) => this.vehicules = page.content ?? page,
      error: () => {}
    });
    
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe({
      next: (page: any) => this.chauffeurs = page.content ?? page,
      error: () => {}
    });

    this.route.queryParams.subscribe(qp => {
      this.selectedVehiculeId = qp['vehiculeId'] ? +qp['vehiculeId'] : '';
      this.selectedChauffeurId = qp['chauffeurId'] ? +qp['chauffeurId'] : '';
      this.startDate = qp['startDate'] || '';
      this.endDate = qp['endDate'] || '';
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    // We load all to allow local filtering, or we could use the backend if it supported it.
    // For now we get a larger set of pleins to filter locally.
    this.fleetService.getPleins({ page: 0, size: 2000 }).subscribe({
      next: (data: any) => {
        this.allPleins = Array.isArray(data) ? data : (data.content ?? []);
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allPleins];

    if (this.selectedVehiculeId) {
      filtered = filtered.filter(p => p.vehiculeId == this.selectedVehiculeId);
    }
    
    if (this.selectedChauffeurId) {
      filtered = filtered.filter(p => p.chauffeurId == this.selectedChauffeurId);
    }

    if (this.startDate) {
      const start = new Date(this.startDate).getTime();
      filtered = filtered.filter(p => p.fillingDate && new Date(p.fillingDate).getTime() >= start);
    }

    if (this.endDate) {
      // Add 24h to include the end date fully
      const end = new Date(this.endDate).getTime() + 86400000 - 1;
      filtered = filtered.filter(p => p.fillingDate && new Date(p.fillingDate).getTime() <= end);
    }

    this.pleins = filtered;
  }

  onFilterChange(): void {
    this.router.navigate([], {
      queryParams: { 
        vehiculeId: this.selectedVehiculeId || null,
        chauffeurId: this.selectedChauffeurId || null,
        startDate: this.startDate || null,
        endDate: this.endDate || null
      },
      queryParamsHandling: 'merge'
    });
  }

  resetFilters(): void {
    this.selectedVehiculeId = '';
    this.selectedChauffeurId = '';
    this.startDate = '';
    this.endDate = '';
    this.onFilterChange();
  }

  goAdd(): void {
    this.router.navigate(['/fleet/fuel-fillings/new'], {
      queryParams: this.selectedVehiculeId ? { vehiculeId: this.selectedVehiculeId } : {}
    });
  }

  goEdit(p: PleinCarburantResponse): void {
    this.router.navigate([`/fleet/fuel-fillings/${p.id}/edit`]);
  }

  delete(p: PleinCarburantResponse): void {
    if (!confirm('Supprimer ce plein ?')) return;
    this.fleetService.deletePlein(p.id!).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 })
    });
  }



downloadProof(pleinId: number, filename = 'justificatif'): void {
  this.fleetService.getProofFile(pleinId).subscribe({
    next: (res) => {
      const blob = res.body!;
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="(.+)"/);
      const finalName = match?.[1] ?? filename;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalName;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: () => this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 3000 })
  });
}

viewProof(pleinId: number, reference = ''): void {
  this.proofModalOpen = true;
  this.proofLoading = true;
  this.currentProofId = pleinId;
  this.currentProofRef = reference;

  this.fleetService.getProofFile(pleinId).subscribe({
    next: (res) => {
      const blob = res.body!;
      const contentType = res.headers.get('Content-Type') || blob.type;
      this.proofIsImage = contentType.startsWith('image/');

      const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
      this.currentProofBlobUrl = url;
      this.proofSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.proofLoading = false;
    },
    error: () => {
      this.proofLoading = false;
      this.snackBar.open('Impossible de charger le justificatif', 'Fermer', { duration: 3000 });
      this.proofModalOpen = false;
    }
  });
}

closeProofModal(): void {
  this.proofModalOpen = false;
  if (this.currentProofBlobUrl) {
    window.URL.revokeObjectURL(this.currentProofBlobUrl);
    this.currentProofBlobUrl = null;
  }
  this.proofSafeUrl = null;
}
}