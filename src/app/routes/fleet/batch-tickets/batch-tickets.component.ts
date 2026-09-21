import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { BatchTicketService } from './batch-ticket.service';
import { BatchTicketItem, BatchSaveItemPayload, BatchSaveResultResponse, TicketType } from './batch-ticket.model';
import { FleetService, VehiculeResponse } from '../fleet.service';
import { MissionService } from '../mission/mission.service';

@Component({
  selector: 'app-batch-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './batch-tickets.component.html',
  styleUrls: ['./batch-tickets.component.scss']
})
export class BatchTicketsComponent implements OnInit {
  private readonly batchService = inject(BatchTicketService);
  private readonly fleetService = inject(FleetService);
  private readonly missionService = inject(MissionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  // Files & State
  selectedFiles: File[] = [];
  filePreviews: { file: File; url: string }[] = [];
  tickets: BatchTicketItem[] = [];

  // Dropdowns
  vehicules: VehiculeResponse[] = [];
  chauffeurs: any[] = [];
  missions: any[] = [];

  // Global selections (Apply to all tickets in batch)
  globalVehiculeId: number | null = null;
  globalChauffeurId: number | null = null;
  globalMissionId: number | null = null;

  // UI state
  step: 'UPLOAD' | 'REVIEW' | 'SUCCESS' = 'UPLOAD';
  isAnalyzing = false;
  isSaving = false;
  isDragging = false;
  saveResult: BatchSaveResultResponse | null = null;

  readonly fuelTypes = ['DIESEL', 'ESSENCE', 'GPL', 'ELECTRIQUE'];

  ngOnInit(): void {
    this.loadDropdowns();
  }

  loadDropdowns(): void {
    this.fleetService.getVehicules({ size: 1000 }).subscribe({
      next: (page: any) => this.vehicules = page.content ?? page,
      error: () => {}
    });

    this.fleetService.getChauffeurs({ size: 1000 }).subscribe({
      next: (page: any) => this.chauffeurs = page.content ?? page,
      error: () => {}
    });

    this.missionService.findAll(0, 1000).subscribe({
      next: (page: any) => this.missions = page.content ?? page,
      error: () => {}
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  addFiles(files: File[]): void {
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length === 0) {
      this.snackBar.open('Veuillez sélectionner des fichiers images (JPG, PNG) ou PDF', 'Fermer', { duration: 3000 });
      return;
    }

    const availableSlots = 20 - this.selectedFiles.length;
    if (availableSlots <= 0) {
      this.snackBar.open('Vous avez atteint la limite de 20 tickets par lot', 'Fermer', { duration: 3000 });
      return;
    }

    const newFiles = validFiles.slice(0, availableSlots);
    newFiles.forEach(file => {
      this.selectedFiles.push(file);
      const url = URL.createObjectURL(file);
      this.filePreviews.push({ file, url });
    });

    if (validFiles.length > availableSlots) {
      this.snackBar.open(`Seuls les ${availableSlots} premiers fichiers ont été ajoutés (max 10).`, 'Fermer', { duration: 3000 });
    }
  }

  removeFile(index: number): void {
    URL.revokeObjectURL(this.filePreviews[index].url);
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  clearAllFiles(): void {
    this.filePreviews.forEach(p => URL.revokeObjectURL(p.url));
    this.selectedFiles = [];
    this.filePreviews = [];
  }

  startAnalysis(): void {
    if (this.selectedFiles.length === 0) return;

    this.isAnalyzing = true;
    this.batchService.analyzeBatch(this.selectedFiles).subscribe({
      next: (results) => {
        this.isAnalyzing = false;
        this.tickets = results.map((item, idx) => ({
          ...item,
          file: this.selectedFiles[idx],
          previewUrl: this.filePreviews[idx]?.url,
          vehiculeId: this.globalVehiculeId ?? undefined,
          chauffeurId: this.globalChauffeurId ?? undefined,
          missionId: this.globalMissionId ?? undefined,
          isEditing: false
        }));
        this.step = 'REVIEW';
        this.snackBar.open(`${this.tickets.length} tickets analysés par l'IA avec succès.`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.isAnalyzing = false;
        const msg = err?.error?.detail || err?.error?.message || "Erreur lors du traitement par lot par l'IA";
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
      }
    });
  }

  onGlobalVehiculeChange(): void {
    this.tickets.forEach(t => t.vehiculeId = this.globalVehiculeId ?? undefined);
  }

  onGlobalChauffeurChange(): void {
    this.tickets.forEach(t => t.chauffeurId = this.globalChauffeurId ?? undefined);
  }

  onGlobalMissionChange(): void {
    this.tickets.forEach(t => t.missionId = this.globalMissionId ?? undefined);
  }

  toggleEdit(ticket: BatchTicketItem): void {
    ticket.isEditing = !ticket.isEditing;
  }

  removeTicket(index: number): void {
    const removed = this.tickets.splice(index, 1);
    // Re-assigner les indices pour garder une suite cohérente #1, #2, ...
    this.tickets.forEach((t, idx) => {
      t.ticketIndex = idx + 1;
    });

    if (this.tickets.length === 0) {
      this.resetBatch();
      this.snackBar.open('Tous les tickets ont été retirés du lot.', 'Info', { duration: 3000 });
    } else {
      this.snackBar.open('Ticket retiré du lot avec succès.', 'OK', { duration: 2500 });
    }
  }

  updateType(ticket: BatchTicketItem, type: TicketType): void {
    ticket.ticketType = type;
    if (type === 'PEAGE' && !ticket.amountTTC && ticket.totalCost) {
      ticket.amountTTC = ticket.totalCost;
    } else if (type === 'CARBURANT' && !ticket.totalCost && ticket.amountTTC) {
      ticket.totalCost = ticket.amountTTC;
    }
  }

  getValidCount(): number {
    return this.tickets.filter(t => t.ticketType !== 'UNKNOWN' && (t.vehiculeId || this.globalVehiculeId)).length;
  }

  getWarningCount(): number {
    return this.tickets.filter(t => t.dateConfidence === 'LOW' || t.dateConfidence === 'NONE' || t.ticketType === 'UNKNOWN').length;
  }

  saveAll(): void {
    const vehId = this.globalVehiculeId;
    if (!vehId && this.tickets.some(t => !t.vehiculeId)) {
      this.snackBar.open('Veuillez sélectionner un véhicule global pour l\'ensemble des dépense (ou par ticket)', 'Fermer', { duration: 4000 });
      return;
    }

    const invalidItems = this.tickets.filter(t => t.ticketType === 'UNKNOWN');
    if (invalidItems.length > 0) {
      this.snackBar.open('Certains tickets n\'ont pas de type défini (Péage ou Carburant). Veuillez les corriger.', 'Fermer', { duration: 4000 });
      return;
    }

    const payloadItems: BatchSaveItemPayload[] = this.tickets.map(t => ({
      ticketIndex: t.ticketIndex,
      ticketType: t.ticketType,
      vehiculeId: t.vehiculeId || vehId!,
      chauffeurId: t.chauffeurId || this.globalChauffeurId || undefined,
      missionId: t.missionId || this.globalMissionId || undefined,
      operationDate: t.operationDate,
      receiptNumber: t.receiptNumber,
      notes: t.notes,
      amountTTC: t.amountTTC || t.totalCost,
      amountHT: t.amountHT,
      tvaAmount: t.tvaAmount,
      tvaRate: t.tvaRate,
      gareEntree: t.gareEntree,
      gareSortie: t.gareSortie,
      societeAutoroute: t.societeAutoroute,
      quantityLiters: t.quantityLiters,
      pricePerLiter: t.pricePerLiter,
      totalCost: t.totalCost || t.amountTTC,
      fuelType: t.fuelType
    }));

    const filesMap = new Map<number, File>();
    this.tickets.forEach(t => {
      if (t.file) {
        filesMap.set(t.ticketIndex, t.file);
      }
    });

    this.isSaving = true;
    this.batchService.saveBatch({ items: payloadItems }, filesMap).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.saveResult = res;
        this.step = 'SUCCESS';
        this.snackBar.open(`${res.savedCount} dépenses enregistrées avec succès dans la base.`, 'Super', { duration: 4000 });
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.detail || err?.error?.message || "Erreur lors de l'enregistrement des tickets";
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
      }
    });
  }

  resetBatch(): void {
    this.clearAllFiles();
    this.tickets = [];
    this.saveResult = null;
    this.step = 'UPLOAD';
  }

  goToTolls(): void {
    this.router.navigate(['/fleet/tolls']);
  }

  goToFuel(): void {
    this.router.navigate(['/fleet/fuel-fillings']);
  }
}
