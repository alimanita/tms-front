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

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';
import { isAdminRole } from 'app/core/authentication/helpers';

@Component({
  selector: 'app-fuel-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FormsModule, MatIconModule, PaginationBarComponent],
  templateUrl: './fuel-list.component.html',
  styleUrls: ['./fuel-list.component.scss'],
})
export class FuelListComponent implements OnInit {
  isAdmin = isAdminRole();
  allPleins: PleinCarburantResponse[] = [];
  pleins: PleinCarburantResponse[] = [];
  vehicules: VehiculeResponse[]    = [];
  chauffeurs: ChauffeurResponse[]  = [];
  
  selectedIds: Set<number> = new Set();
  
  // Multi-sort: tableau de critères triés par priorité
  sortCriteria: { column: string; direction: 'asc' | 'desc' }[] = [
    { column: 'fillingDate', direction: 'desc' }
  ];

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
      const start = new Date(this.startDate + 'T00:00:00').getTime();
      filtered = filtered.filter(p => p.fillingDate && new Date(p.fillingDate).getTime() >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate + 'T23:59:59').getTime();
      filtered = filtered.filter(p => p.fillingDate && new Date(p.fillingDate).getTime() <= end);
    }

    // Multi-sort
    const dateColumns = ['fillingDate'];
    filtered.sort((a: any, b: any) => {
      for (const criterion of this.sortCriteria) {
        let valA = a[criterion.column];
        let valB = b[criterion.column];

        if (dateColumns.includes(criterion.column)) {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        }

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;

        if (comparison !== 0) {
          return criterion.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    this.pleins = filtered;
  }

  getSortDirection(column: string): 'asc' | 'desc' | null {
    const found = this.sortCriteria.find(c => c.column === column);
    return found ? found.direction : null;
  }

  getSortRank(column: string): number | null {
    const idx = this.sortCriteria.findIndex(c => c.column === column);
    return idx >= 0 ? idx + 1 : null;
  }

  sortBy(column: string): void {
    const existingIdx = this.sortCriteria.findIndex(c => c.column === column);
    if (existingIdx >= 0) {
      const current = this.sortCriteria[existingIdx];
      if (current.direction === 'desc') {
        this.sortCriteria[existingIdx] = { column, direction: 'asc' };
      } else {
        this.sortCriteria.splice(existingIdx, 1);
      }
    } else {
      this.sortCriteria.unshift({ column, direction: 'desc' });
    }
    this.applyFilters();
  }

  resetSort(): void {
    this.sortCriteria = [{ column: 'fillingDate', direction: 'desc' }];
    this.applyFilters();
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
            
            const textHeight = 5;
            
            // Calculer l'espace max pour l'image en prenant en compte les marges, l'espacement et le texte
            const maxAllowedHeight = (maxPageHeight - 3 * marginY - gap - 2 * textHeight - 10) / 2;
            if (imgHeight > maxAllowedHeight) {
                imgHeight = maxAllowedHeight;
                imgWidth = (imgProps.width * imgHeight) / imgProps.height;
            }

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

  getTotalQuantity(): number {
    return this.pleins.reduce((acc, p) => acc + (p.quantityLiters || 0), 0);
  }

  getTotalAmount(): number {
    return this.pleins.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'pleins';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['pleins'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}