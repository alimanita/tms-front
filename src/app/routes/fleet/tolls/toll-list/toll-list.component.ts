import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PeageResponse } from '../peage.model';
import { jsPDF } from 'jspdf';
import { PaginationBarComponent, PageChangeEvent } from '../../../../shared/components/pagination-bar/pagination-bar.component';
import { PaginatePipe } from '../../../../shared/pipes/paginate.pipe';
import { isAdminRole } from 'app/core/authentication/helpers';

@Component({
  selector: 'app-toll-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, FormsModule, MatIconModule, PaginationBarComponent, PaginatePipe],
  templateUrl: './toll-list.component.html',
  styleUrls: ['./toll-list.component.scss'],
})
export class TollListComponent implements OnInit {
  isAdmin = isAdminRole();
  allTolls: PeageResponse[] = [];
  tolls: PeageResponse[] = [];
  vehicules: VehiculeResponse[] = [];
  chauffeurs: ChauffeurResponse[] = [];
  selectedIds: Set<number> = new Set();
  
  // Multi-sort: tableau de critères triés par priorité
  sortCriteria: { column: string; direction: 'asc' | 'desc' }[] = [
    { column: 'datePassage', direction: 'desc' }
  ];

  pageIndex = 0;
  pageSize = 10;

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
    this.fleetService.getPeages({ page: 0, size: 2000 }).subscribe({
      next: (data: any) => {
        this.allTolls = Array.isArray(data) ? data : (data.content ?? []);
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
    let filtered = [...this.allTolls];

    if (this.selectedVehiculeId) {
      filtered = filtered.filter(p => p.vehiculeId == this.selectedVehiculeId);
    }
    
    if (this.selectedChauffeurId) {
      filtered = filtered.filter(p => p.chauffeurId == this.selectedChauffeurId);
    }

    if (this.startDate) {
      const start = new Date(this.startDate + 'T00:00:00').getTime();
      filtered = filtered.filter(p => p.datePassage && new Date(p.datePassage).getTime() >= start);
    }

    if (this.endDate) {
      const end = new Date(this.endDate + 'T23:59:59').getTime();
      filtered = filtered.filter(p => p.datePassage && new Date(p.datePassage).getTime() <= end);
    }

    // Multi-sort
    const dateColumns = ['datePassage'];
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

    this.tolls = filtered;
    this.pageIndex = 0;
  }

  // Retourne la direction active pour une colonne, ou null si non triée
  getSortDirection(column: string): 'asc' | 'desc' | null {
    const found = this.sortCriteria.find(c => c.column === column);
    return found ? found.direction : null;
  }

  // Retourne le rang de priorité (1er, 2ème...) ou null
  getSortRank(column: string): number | null {
    const idx = this.sortCriteria.findIndex(c => c.column === column);
    return idx >= 0 ? idx + 1 : null;
  }

  sortBy(column: string): void {
    const existingIdx = this.sortCriteria.findIndex(c => c.column === column);
    if (existingIdx >= 0) {
      const current = this.sortCriteria[existingIdx];
      if (current.direction === 'desc') {
        // desc → asc
        this.sortCriteria[existingIdx] = { column, direction: 'asc' };
      } else {
        // asc → suppression du critère
        this.sortCriteria.splice(existingIdx, 1);
      }
    } else {
      // Nouvelle colonne: ajout en premier critère
      this.sortCriteria.unshift({ column, direction: 'desc' });
    }
    this.applyFilters();
  }

  resetSort(): void {
    this.sortCriteria = [{ column: 'datePassage', direction: 'desc' }];
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

  onPageChange(event: PageChangeEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  addPeage(): void {
    this.router.navigate(['/fleet/tolls/new']);
  }

  goEdit(t: PeageResponse): void {
    this.router.navigate([`/fleet/tolls/${t.id}/edit`]);
  }

  delete(t: PeageResponse): void {
    if (!confirm('Supprimer ce péage ?')) return;
    this.fleetService.deletePeage(t.id!).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 })
    });
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
      this.tolls.forEach(t => this.selectedIds.add(t.id));
    } else {
      this.selectedIds.clear();
    }
  }

  isAllSelected(): boolean {
    return this.tolls.length > 0 && this.tolls.every(t => this.selectedIds.has(t.id));
  }

  exportCSV(): void {
    if (this.selectedIds.size === 0) return;
    const selecteTolls = this.tolls.filter(t => this.selectedIds.has(t.id));
    
    let csv = 'ID,Reference,Date,Véhicule,Chauffeur,Montant TTC,Montant HT,TVA,Gare Entrée,Gare Sortie\n';
    selecteTolls.forEach(t => {
      csv += `${t.id},${t.reference},${t.datePassage || ''},${t.vehiculeImmatriculation || ''},${t.chauffeurNom || ''},${t.amountTTC || ''},${t.amountHT || ''},${t.tvaAmount || ''},"${t.gareEntree || ''}","${t.gareSortie || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'peages.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportPDF(): Promise<void> {
    if (this.selectedIds.size === 0) return;
    const selecteTolls = this.tolls.filter(t => this.selectedIds.has(t.id) && t.proofUrl);
    if (selecteTolls.length === 0) {
      this.snackBar.open('Aucun justificatif disponible pour la sélection', 'Fermer', { duration: 3000 });
      return;
    }

    this.snackBar.open('Génération du PDF en cours...', '', { duration: 3000 });
    const pdf = new jsPDF();
    
    const marginX = 10;
    const marginY = 10;
    const usableWidh = pdf.internal.pageSize.getWidth() - 2 * marginX;
    const colCount = 2;
    const gap = 10;
    const colWidh = (usableWidh - gap * (colCount - 1)) / colCount;
    const maxPageHeight = pdf.internal.pageSize.getHeight();
    
    let currentX = marginX;
    let currentY = marginY;
    let currentRowHeight = 0;
    let currentColumn = 0;
    let imageCount = 0;

    for (const toll of selecteTolls) {
      try {
        const res = await this.fleetService.getPeageProofFile(toll.id).toPromise();
        if (res && res.body) {
          const blob = res.body;
          const contentType = res.headers.get('Content-Type') || blob.type;
          
          if (contentType.startsWith('image/')) {
            const base64 = await this.blobToBase64(blob);
            
            const imgProps = pdf.getImageProperties(base64);
            let imgWidh = colWidh;
            let imgHeight = (imgProps.height * imgWidh) / imgProps.width;
            
            const textHeight = 5;
            
            // Calculer l'espace max pour l'image en prenant en compte les marges, l'espacement et le texte
            // 3 * marginY (haut, milieu, bas), 1 * gap, 2 * textHeight
            const maxAllowedHeight = (maxPageHeight - 3 * marginY - gap - 2 * textHeight - 10) / 2;
            if (imgHeight > maxAllowedHeight) {
                imgHeight = maxAllowedHeight;
                imgWidh = (imgProps.width * imgHeight) / imgProps.height;
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
            pdf.text(`Péage: ${toll.reference || 'N/A'} - ${toll.amountTTC}€`, currentX, currentY + textHeight);
            
            const offsetX = currentX + (colWidh - imgWidh) / 2;
            pdf.addImage(base64, 'JPEG', offsetX, currentY + textHeight + 2, imgWidh, imgHeight);
            
            currentRowHeight = Math.max(currentRowHeight, totalItemHeight);
            currentX += colWidh + gap;
            currentColumn++;
            imageCount++;
          } else {
             console.warn('Type non supporté pour PDF merge (ex: PDF). Ignoré pour ce justificatif.');
          }
        }
      } catch (e) {
        console.error('Erreur lors du téléchargement du justificatif', e);
      }
    }
    
    if (imageCount > 0) {
      pdf.save('justificatifs_peages.pdf');
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

  downloadProof(peageId: number, filename = 'justificatif'): void {
    this.fleetService.getPeageProofFile(peageId).subscribe({
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
  
  viewProof(peageId: number, reference = ''): void {
    this.proofModalOpen = true;
    this.proofLoading = true;
    this.currentProofId = peageId;
    this.currentProofRef = reference;
  
    this.fleetService.getPeageProofFile(peageId).subscribe({
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

  getTotalAmountTTC(): number {
    return this.tolls.reduce((acc, t) => acc + (t.amountTTC || 0), 0);
  }
}
