import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PleinCarburantResponse, VehiculeResponse } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { jsPDF } from 'jspdf';

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
  
  selectedIds: Set<number> = new Set();

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

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleAll(event: any): void {
    if (event.target.checked) {
      this.pleins.forEach(p => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  isAllSelected(): boolean {
    return this.pleins.length > 0 && this.pleins.every(p => this.selectedIds.has(p.id));
  }

  exportCSV(): void {
    if (this.selectedIds.size === 0) return;
    const selectedPleins = this.pleins.filter(p => this.selectedIds.has(p.id));
    
    let csv = 'Référence,Véhicule,Chauffeur,Date,Carburant,Quantité,Prix/L,Montant Total,Montant HT,TVA,Conso (L/100)\n';
    selectedPleins.forEach(p => {
      csv += `${p.reference || ''},${p.vehiculeImmatriculation || ''},${p.chauffeurNom || ''},${p.fillingDate || ''},${p.fuelType || ''},${p.quantityLiters || ''},${p.pricePerLiter || ''},${p.totalAmount || ''},${p.amountHT || ''},${p.tvaAmount || ''},${p.consumptionRate || ''}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'carburants.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportPDF(): Promise<void> {
    if (this.selectedIds.size === 0) return;
    const selectedPleins = this.pleins.filter(p => this.selectedIds.has(p.id) && p.proofUrl);
    if (selectedPleins.length === 0) {
      this.snackBar.open('Aucun justificatif disponible pour la sélection', 'Fermer', { duration: 3000 });
      return;
    }

    this.snackBar.open('Génération du PDF en cours...', '', { duration: 3000 });
    const pdf = new jsPDF();
    
    const marginX = 10;
    const marginY = 10;
    const usableWidth = pdf.internal.pageSize.getWidth() - 2 * marginX;
    const colCount = 2;
    const gap = 10;
    const colWidth = (usableWidth - gap * (colCount - 1)) / colCount;
    const maxPageHeight = pdf.internal.pageSize.getHeight();
    
    let currentX = marginX;
    let currentY = marginY;
    let currentRowHeight = 0;
    let currentColumn = 0;
    let imageCount = 0;

    for (const plein of selectedPleins) {
      try {
        const res = await this.fleetService.getProofFile(plein.id).toPromise();
        if (res && res.body) {
          const blob = res.body;
          const contentType = res.headers.get('Content-Type') || blob.type;
          
          if (contentType.startsWith('image/')) {
            const base64 = await this.blobToBase64(blob);
            
            const imgProps = pdf.getImageProperties(base64);
            let imgWidth = colWidth;
            let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            
            const maxAllowedHeight = (maxPageHeight - 3 * marginY) / 2;
            if (imgHeight > maxAllowedHeight) {
                imgHeight = maxAllowedHeight;
                imgWidth = (imgProps.width * imgHeight) / imgProps.height;
            }

            const textHeight = 5;
            const totalItemHeight = imgHeight + textHeight + 2;

            if (currentColumn >= colCount) {
              currentColumn = 0;
              currentX = marginX;
              currentY += currentRowHeight + gap;
              currentRowHeight = 0;
            }

            if (currentY + totalItemHeight > maxPageHeight - marginY && imageCount > 0) {
               pdf.addPage();
               currentX = marginX;
               currentY = marginY;
               currentRowHeight = 0;
               currentColumn = 0;
            }

            pdf.setFontSize(9);
            pdf.text(`Plein: ${plein.reference || 'N/A'} - ${plein.vehiculeImmatriculation || 'N/A'} - ${plein.totalAmount}€`, currentX, currentY + textHeight);
            
            const offsetX = currentX + (colWidth - imgWidth) / 2;
            pdf.addImage(base64, 'JPEG', offsetX, currentY + textHeight + 2, imgWidth, imgHeight);
            
            currentRowHeight = Math.max(currentRowHeight, totalItemHeight);
            currentX += colWidth + gap;
            currentColumn++;
            imageCount++;
          } else {
             console.warn('Type non supporté pour PDF merge. Ignoré pour ce justificatif.');
          }
        }
      } catch (e) {
        console.error('Erreur lors du téléchargement du justificatif', e);
      }
    }
    
    if (imageCount > 0) {
      pdf.save('justificatifs_carburant.pdf');
      this.snackBar.open('PDF généré avec succès', 'Fermer', { duration: 3000 });
    } else {
      this.snackBar.open('Erreur: Aucun justificatif image valide trouvé', 'Fermer', { duration: 3000 });
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
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