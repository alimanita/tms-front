import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PieceRechangeResponse } from '../../ordre-travail/ordre-travail.model';
import { OrdreTravailService } from '../../ordre-travail/ordre-travail.service';
import { PieceRechangeFormComponent } from '../piece-rechange-form/piece-rechange-form.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-piece-rechange-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatMenuModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    PieceRechangeFormComponent,
  ],
  templateUrl: './piece-rechange-list.component.html',
  styleUrl: './piece-rechange-list.component.scss',
})
export class PieceRechangeListComponent implements OnInit {
  pieces = signal<PieceRechangeResponse[]>([]);
  loading = signal(false);

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  stockFaibleOnly = false;
  searchTerm = '';

  isDialogOpen = false;
  pieceEnEdition: PieceRechangeResponse | null = null;

  selectedIds: Set<number> = new Set();

  proofModalOpen = false;
  proofLoading = false;
  proofIsImage = false;
  proofSafeUrl: SafeUrl | null = null;
  currentProofId: number | null = null;
  currentProofRef = '';
  private currentProofBlobUrl: string | null = null;

  constructor(
    private ordreTravailService: OrdreTravailService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    if (this.stockFaibleOnly) {
      this.ordreTravailService.findStockFaible().subscribe({
        next: (list) => {
          this.pieces.set(this.applySearch(list));
          this.totalElements = list.length;
          this.totalPages = 1;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erreur lors du chargement du stock faible', 'Fermer', { duration: 3000 });
        },
      });
      return;
    }

    this.ordreTravailService.findAllPieces(this.pageIndex, this.pageSize).subscribe({
      next: (page) => {
        this.pieces.set(this.applySearch(page.content));
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des pièces', 'Fermer', { duration: 3000 });
      },
    });
  }

  private applySearch(list: PieceRechangeResponse[]): PieceRechangeResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(p =>
      p.reference.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.minStockQty.toString().includes(term) ||
      p.stockQty.toString().includes(term) ||
      p.unit?.toLowerCase().includes(term) ||
      (p.brand ?? '').toLowerCase().includes(term)
    );
  }

  onSearchChange(): void {
    this.load();
  }

  toggleStockFaible(): void {
    this.stockFaibleOnly = !this.stockFaibleOnly;
    this.pageIndex = 0;
    this.load();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.load();
  }

  isStockFaible(p: PieceRechangeResponse): boolean {
    return p.stockQty <= p.minStockQty;
  }
openCreate(): void {
  this.pieceEnEdition = null;
  this.isDialogOpen = true;
}

  openEdit(p: PieceRechangeResponse): void {
    this.pieceEnEdition = p;
    this.isDialogOpen = true;
  }

  onDialogClosed(): void {
    this.isDialogOpen = false;
  }

  onPieceSaved(): void {
    this.isDialogOpen = false;
    this.load();
  }

  supprimer(p: PieceRechangeResponse): void {
    const confirmation = window.confirm(`Supprimer définitivement la pièce "${p.name}" ?`);
    if (!confirmation) return;

    this.ordreTravailService.deletePiece(p.id).subscribe({
      next: () => {
        this.pieces.set(this.pieces().filter(x => x.id !== p.id));
        this.snackBar.open('Pièce supprimée', 'Fermer', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(
        err.error?.message ?? 'Erreur lors de la suppression', 'Fermer', { duration: 3000 }
      ),
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
      this.pieces().forEach(p => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  isAllSelected(): boolean {
    const currentPieces = this.pieces();
    return currentPieces.length > 0 && currentPieces.every(p => this.selectedIds.has(p.id));
  }

  exportCSV(): void {
    if (this.selectedIds.size === 0) return;
    const selectedPieces = this.pieces().filter(p => this.selectedIds.has(p.id));
    
    let csv = 'Référence,Désignation,Marque,Unité,Emplacement,Coût Unitaire HT,Taux TVA,Montant TVA,TVA Récup,Stock Actuel,Stock Min\n';
    selectedPieces.forEach(p => {
      csv += `"${p.reference}","${p.name}","${p.brand || ''}","${p.unit || ''}","${p.location || ''}",${p.amountHT || p.unitCost || ''},${p.tvaRate || ''},${p.tvaAmount || ''},${p.isTvaRecoverable ? 'Oui' : 'Non'},${p.stockQty},${p.minStockQty}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pieces_rechange.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportPDF(): Promise<void> {
    if (this.selectedIds.size === 0) return;
    const selectedPieces = this.pieces().filter(p => this.selectedIds.has(p.id) && p.receiptPath);
    if (selectedPieces.length === 0) {
      this.snackBar.open('Aucun justificatif disponible pour la sélection', 'Fermer', { duration: 3000 });
      return;
    }

    this.snackBar.open('Génération du PDF en cours...', '', { duration: 3000 });
    
    // Import jsPDF dynamically to avoid issues if not loaded properly
    const { jsPDF } = await import('jspdf');
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

    for (const piece of selectedPieces) {
      try {
        const res = await this.ordreTravailService.getPieceProofFile(piece.id).toPromise();
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
            pdf.text(`Pièce: ${piece.reference || 'N/A'} - ${piece.name}`, currentX, currentY + textHeight);
            
            const offsetX = currentX + (colWidth - imgWidth) / 2;
            pdf.addImage(base64, 'JPEG', offsetX, currentY + textHeight + 2, imgWidth, imgHeight);
            
            currentRowHeight = Math.max(currentRowHeight, totalItemHeight);
            currentX += colWidth + gap;
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
      pdf.save('justificatifs_pieces.pdf');
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

  downloadProof(pieceId: number, filename = 'justificatif_piece'): void {
    this.ordreTravailService.getPieceProofFile(pieceId).subscribe({
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
  
  viewProof(pieceId: number, reference = ''): void {
    this.proofModalOpen = true;
    this.proofLoading = true;
    this.currentProofId = pieceId;
    this.currentProofRef = reference;
  
    this.ordreTravailService.getPieceProofFile(pieceId).subscribe({
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