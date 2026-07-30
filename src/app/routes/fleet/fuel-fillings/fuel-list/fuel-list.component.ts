import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PleinCarburantResponse, VehiculeResponse } from '../../fleet.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-fuel-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './fuel-list.component.html',
  styleUrls: ['./fuel-list.component.scss'],
})
export class FuelListComponent implements OnInit {
  pleins: PleinCarburantResponse[] = [];
  vehicules: VehiculeResponse[]    = [];
  selectedVehiculeId?: number;
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
    this.fleetService.getVehicules().subscribe({
      next: (page: any) => this.vehicules = page.content ?? page,
      error: () => {}
    });

    this.route.queryParams.subscribe(qp => {
      this.selectedVehiculeId = qp['vehiculeId'] ? +qp['vehiculeId'] : undefined;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    const obs = this.selectedVehiculeId
      ? this.fleetService.getPleinsByVehicule(this.selectedVehiculeId)
      : this.fleetService.getPleins();

    obs.subscribe({
      next: (data: any) => {
        this.pleins = Array.isArray(data) ? data : (data.content ?? []);
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onVehiculeFilter(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.router.navigate([], {
      queryParams: { vehiculeId: id || null },
      queryParamsHandling: 'merge'
    });
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