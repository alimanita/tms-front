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

  // Multi-sort
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

  totalElements = 0;
  summaryTotalAmount = 0;
  summaryTotalQuantity = 0;

  load(): void {
    this.loading = true;

    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      vehiculeId: this.selectedVehiculeId || '',
      chauffeurId: this.selectedChauffeurId || '',
      startDate: this.startDate || '',
      endDate: this.endDate || ''
    };

    if (this.sortCriteria.length > 0) {
      params.sort = this.sortCriteria.map(c => `${c.column},${c.direction}`);
    }

    this.fleetService.getPleins(params).subscribe({
      next: (data: any) => {
        this.pleins = Array.isArray(data) ? data : (data.content ?? []);
        this.totalElements = data.totalElements ?? this.pleins.length;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });

    const summaryParams: any = {
      vehiculeId: this.selectedVehiculeId || '',
      chauffeurId: this.selectedChauffeurId || '',
      startDate: this.startDate || '',
      endDate: this.endDate || ''
    };
    this.fleetService.getPleinSummary(summaryParams).subscribe({
      next: (summary: any) => {
        this.summaryTotalAmount = summary?.totalAmount ?? 0;
        this.summaryTotalQuantity = summary?.totalQuantity ?? 0;
      },
      error: () => {}
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.load();
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

    let csv = 'Reference,Vehicule,Chauffeur,Date,Carburant,Quantite,Prix/L,Montant Total,Montant HT,TVA,Conso (L/100)\n';
    selectedPleins.forEach(p => {
      csv += `${p.reference || ''},${p.vehiculeImmatriculation || ''},${p.chauffeurNom || ''},${p.fillingDate || ''},${p.fuelType || ''},${p.quantityLiters || ''},${p.pricePerLiter || ''},${p.totalAmount || ''},${p.amountHT || ''},${p.tvaAmount || ''},${p.consumptionRate || ''}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'carburants.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export PDF multi-tickets: pack le maximum de tickets par page (4, 6 ou 8)
   * selon le ratio hauteur/largeur des images.
   * - Tickets etroits/hauts (ratio > 2.5) : 2 col x 4 lignes = 8 par page
   * - Tickets moyens       (ratio > 1.5) : 2 col x 3 lignes = 6 par page
   * - Tickets larges/courts              : 2 col x 2 lignes = 4 par page
   */
  async exportPDF(): Promise<void> {
    if (this.selectedIds.size === 0) return;
    const selectedPleins = this.pleins.filter(p => this.selectedIds.has(p.id) && p.proofUrl);
    if (selectedPleins.length === 0) {
      this.snackBar.open('Aucun justificatif disponible pour la selection', 'Fermer', { duration: 3000 });
      return;
    }

    this.snackBar.open('Generation du PDF en cours...', '', { duration: 5000 });

    // --- 1. Charger toutes les images ---
    interface ImgEntry {
      base64: string;
      format: string;
      origW: number;
      origH: number;
      label: string;
    }
    const images: ImgEntry[] = [];

    for (const plein of selectedPleins) {
      try {
        const res = await this.fleetService.getProofFile(plein.id).toPromise();
        if (res && res.body) {
          const blob = res.body;
          const contentType = res.headers.get('Content-Type') || blob.type;
          if (contentType.startsWith('image/')) {
            const base64 = await this.blobToBase64(blob);
            const isPng = contentType.includes('png') || base64.startsWith('data:image/png');
            const format = isPng ? 'PNG' : 'JPEG';
            // Obtenir dimensions reelles via Image
            const dims = await this.getImageDimensions(base64);
            images.push({
              base64,
              format,
              origW: dims.width,
              origH: dims.height,
              label: `${plein.reference || 'REF'} - ${plein.vehiculeImmatriculation || ''} - ${plein.totalAmount || ''}dt`
            });
          }
        }
      } catch (e) {
        console.error('Erreur telechargement justificatif', e);
      }
    }

    if (images.length === 0) {
      this.snackBar.open('Aucun justificatif image valide trouve', 'Fermer', { duration: 3000 });
      return;
    }

    // --- 2. Determiner le layout selon ratio moyen ---
    const avgRatio = images.reduce((s, i) => s + i.origH / i.origW, 0) / images.length;
    const colCount = 2;
    let rowCount: number;
    if (avgRatio > 2.5) {
      rowCount = 4; // 8 par page
    } else if (avgRatio > 1.5) {
      rowCount = 3; // 6 par page
    } else {
      rowCount = 2; // 4 par page
    }
    const perPage = colCount * rowCount;

    // --- 3. Generer le PDF ---
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageH = pdf.internal.pageSize.getHeight();  // 297 mm
    const marginX = 6;
    const marginY = 8;
    const gapX = 5;
    const gapY = 7;
    const labelH = 5;  // hauteur reservee pour le texte de reference

    const cellW = (pageW - marginX * 2 - gapX * (colCount - 1)) / colCount;
    const cellH = (pageH - marginY * 2 - gapY * (rowCount - 1) - labelH * rowCount) / rowCount;

    images.forEach((img, idx) => {
      if (idx > 0 && idx % perPage === 0) {
        pdf.addPage();
      }
      const posInPage = idx % perPage;
      const col = posInPage % colCount;
      const row = Math.floor(posInPage / colCount);

      const cellX = marginX + col * (cellW + gapX);
      const cellY = marginY + row * (cellH + labelH + gapY);

      // Label
      pdf.setFontSize(7);
      pdf.setTextColor(80, 80, 80);
      pdf.text(img.label, cellX, cellY + labelH - 1, { maxWidth: cellW });

      // Image (fit dans cellule en preservant ratio)
      const scale = Math.min(cellW / img.origW, cellH / img.origH);
      const dw = img.origW * scale;
      const dh = img.origH * scale;
      const imgX = cellX + (cellW - dw) / 2;
      const imgY = cellY + labelH + (cellH - dh) / 2;

      try {
        pdf.addImage(img.base64, img.format, imgX, imgY, dw, dh);
      } catch {
        // Fallback: essayer avec JPEG
        try { pdf.addImage(img.base64, 'JPEG', imgX, imgY, dw, dh); } catch {}
      }
    });

    pdf.save('justificatifs_carburant.pdf');
    this.snackBar.open('PDF genere avec succes (' + images.length + ' ticket(s))', 'Fermer', { duration: 3500 });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 100, height: 150 }); // fallback
      img.src = base64;
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
      error: () => this.snackBar.open('Erreur lors du telechargement', 'Fermer', { duration: 3000 })
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

  getTotalQuantity(): number { return this.summaryTotalQuantity; }
  getTotalAmount(): number { return this.summaryTotalAmount; }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;

  get paginatedItems(): PleinCarburantResponse[] {
    if (this.pleins.length > this.pageSize) {
      const start = this.pageIndex * this.pageSize;
      return this.pleins.slice(start, start + this.pageSize);
    }
    return this.pleins;
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.load();
  }
}
