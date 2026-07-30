import {
  Component, EventEmitter, Input, Output, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrdreTravailService } from '../ordre-travail.service';
import {
  OrdreTravailRequest, OrdreTravailResponse, TypeEntiteOT,
  TYPES_MAINTENANCE, PieceRechangeResponse
} from '../ordre-travail.model';
import { FleetService, VehiculeResponse, MachineResponse } from '../../fleet.service';
import { PieceRechangeFormComponent } from '../../piece-rechange/piece-rechange-form/piece-rechange-form.component'; // ← ajuste le chemin réel
import { AutocompleteComponent, AutocompleteOption } from '../../../app/shared/autocomplete/autocomplete.component';

@Component({
  selector: 'app-entretien-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule,
     MatSnackBarModule,
    AutocompleteComponent, PieceRechangeFormComponent],
  templateUrl: './entretien-dialog.component.html',
  styleUrl: './entretien-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntretienDialogComponent implements OnChanges {

  pieceOptions: AutocompleteOption[] = [];
  pieceAutocompleteResetKey = 0;
  showPieceCreateForm = false;
  pieceSearchTermForCreate = '';

  @Input() open = false;
  @Input() otToEdit: OrdreTravailResponse | null = null;

  isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() entretienSaved = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.isOpen = this.open;
      if (this.open) this.initForm();
    }
  }

  // ── Phase 1 : infos générales ────────────────────────────────
  form!: FormGroup;
  loading = false;
  ot: OrdreTravailResponse | null = null; // non-null dès que l'OT est créé → phase 2

  vehicules: VehiculeResponse[] = [];
  machines: MachineResponse[] = [];
  pieces: PieceRechangeResponse[] = [];
  readonly typesMaintenance = TYPES_MAINTENANCE;

  // ⚠️ Propriété stockée, PAS un getter — un getter recalculant un nouveau
  // tableau à chaque cycle de détection de changement cause un NG0103
  // (boucle infinie) en mode zoneless.
  entiteOptions: { id: number; label: string }[] = [];

  // ── Phase 2 : formulaires d'ajout ligne par ligne ─────────────
  pieceForm!: FormGroup;
  mainOeuvreForm!: FormGroup;
  ajoutPieceLoading = false;
  ajoutMainOeuvreLoading = false;

  // ── Pièces/main d'oeuvre saisies AVANT la création de l'OT ────
  // (accumulées localement, envoyées au backend juste après la création)
  pendingPieces: { pieceRechangeId: number; pieceName: string; quantityPlanned: number; unitCost: number }[] = [];
  pendingMainOeuvre: { technicianName: string; isExternal: boolean; hoursPlanned?: number; hourlyRate?: number }[] = [];

  constructor(
    private fb: FormBuilder,
    private ordreTravailService: OrdreTravailService,
    private fleetService: FleetService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  private initForm(): void {
    // ── Mode "ajouter des pièces à un entretien existant" ──────
    if (this.otToEdit) {
      this.ot = this.otToEdit;
      this.pieceForm = this.fb.group({
        pieceRechangeId: [null, Validators.required],
        quantityPlanned: [1, [Validators.required, Validators.min(0.01)]],
      });
      this.mainOeuvreForm = this.fb.group({
        technicianName: ['', Validators.required],
        isExternal:     [false],
        hoursPlanned:   [null],
        hourlyRate:     [null],
      });
      this.loadPieces();
      this.cdr.markForCheck();
      return;
    }

    // ── Mode "création" ─────────────────────────────────────────
    this.ot = null;
    this.pendingPieces = [];
    this.pendingMainOeuvre = [];

   this.form = this.fb.group({
  reference:       ['', Validators.required],   // ← ajouté
  entityType:      ['VEHICLE' as TypeEntiteOT, Validators.required],
  entityId:        [null, Validators.required],
  typeMaintenance: ['', Validators.required],
  typeOrdre:       ['PREVENTIVE', Validators.required],
  priorite:        ['NORMAL'],
  description:     [''],
  reportedDate:    [new Date().toISOString().slice(0, 10)],
  scheduledDate:   [''],
  mileageAtOrder:  [null],
  hoursAtOrder:    [null],
  workshop:        [''],
  isExternal:      [false],
  externalProvider:[''],
  estimatedCost:   [null],
  notes:           [''],
});
    this.pieceForm = this.fb.group({
      pieceRechangeId: [null, Validators.required],
      quantityPlanned: [1, [Validators.required, Validators.min(0.01)]],
    });

    this.mainOeuvreForm = this.fb.group({
      technicianName: ['', Validators.required],
      isExternal:     [false],
      hoursPlanned:   [null],
      hourlyRate:     [null],
    });

    this.loadVehicules();
    this.loadMachines();
    this.loadPieces();
    this.cdr.markForCheck();
  }

  private loadVehicules(): void {
    this.fleetService.getVehicules().subscribe({
      next: (page: any) => {
        this.vehicules = page.content ?? page;
        this.updateEntiteOptions();
      },
      error: () => {}
    });
  }

  private loadMachines(): void {
    this.fleetService.getMachines().subscribe({
      next: (page: any) => {
        this.machines = page.content ?? page;
        this.updateEntiteOptions();
      },
      error: () => {}
    });
  }

  private loadPieces(): void {
    this.ordreTravailService.findAllPieces().subscribe({
      next: (page) => {
        this.pieces = page.content ?? [];
        this.updatePieceOptions();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private updatePieceOptions(): void {
    this.pieceOptions = this.pieces
      .filter(p => p.stockQty > 0)
      .map(p => ({
        id: p.id,
        label: p.name,
        sublabel: `${p.reference} — Stock: ${p.stockQty} ${p.unit ?? ''}`.trim(),
      }));
  }

  onCreatePieceClicked(term: string): void {
    this.pieceSearchTermForCreate = term;
    this.showPieceCreateForm = true;
    this.cdr.markForCheck();
  }

  onPieceCreated(piece: PieceRechangeResponse): void {
    this.showPieceCreateForm = false;
    this.loadPieces();
    this.pieceForm.patchValue({ pieceRechangeId: piece.id }); // présélectionne la pièce créée
    this.cdr.markForCheck();
  }

  onPieceFormClosed(): void {
    this.showPieceCreateForm = false;
    this.cdr.markForCheck();
  }

  private updateEntiteOptions(): void {
    if (this.form.value.entityType === 'VEHICLE') {
      this.entiteOptions = this.vehicules.map(v => ({
        id: v.id, label: `${v.immatriculation} — ${v.marque ?? ''} ${v.modele ?? ''}`
      }));
    } else {
      this.entiteOptions = this.machines.map(m => ({ id: m.id, label: m.nom }));
    }
    this.cdr.markForCheck();
  }

  onEntityTypeChange(): void {
    this.form.patchValue({ entityId: null });
    this.updateEntiteOptions();
  }

  // ── Pièces en attente (avant création de l'OT) ────────────────
  ajouterPiecePending(): void {
    if (this.pieceForm.invalid) {
      this.pieceForm.markAllAsTouched();
      return;
    }

    const fv = this.pieceForm.value;
    const piece = this.pieces.find(p => p.id === fv.pieceRechangeId);
    if (!piece) return;

    const dejaReserve = this.pendingPieces
      .filter(p => p.pieceRechangeId === piece.id)
      .reduce((sum, p) => sum + p.quantityPlanned, 0);

    if (piece.stockQty - dejaReserve < fv.quantityPlanned) {
      this.snackBar.open(
        `Stock insuffisant pour "${piece.name}" (disponible: ${piece.stockQty - dejaReserve})`,
        'Fermer', { duration: 4000 }
      );
      return;
    }

    this.pendingPieces.push({
      pieceRechangeId: piece.id,
      pieceName: piece.name,
      quantityPlanned: fv.quantityPlanned,
      unitCost: piece.unitCost ?? 0,
    });

    this.pieceForm.reset({ pieceRechangeId: null, quantityPlanned: 1 });
    this.pieceAutocompleteResetKey++;
    this.cdr.markForCheck();
  }

  retirerPiecePending(index: number): void {
    this.pendingPieces.splice(index, 1);
    this.cdr.markForCheck();
  }

  get totalPiecesPendingEstime(): number {
    return this.pendingPieces.reduce((sum, p) => sum + p.quantityPlanned * p.unitCost, 0);
  }

  // ── Main d'oeuvre en attente (avant création de l'OT) ─────────
  ajouterMainOeuvrePending(): void {
    if (this.mainOeuvreForm.invalid) {
      this.mainOeuvreForm.markAllAsTouched();
      return;
    }

    const fv = this.mainOeuvreForm.value;
    this.pendingMainOeuvre.push({
      technicianName: fv.technicianName,
      isExternal: fv.isExternal,
      hoursPlanned: fv.hoursPlanned ?? undefined,
      hourlyRate: fv.hourlyRate ?? undefined,
    });

    this.mainOeuvreForm.reset({ technicianName: '', isExternal: false, hoursPlanned: null, hourlyRate: null });
    this.cdr.markForCheck();
  }

  retirerMainOeuvrePending(index: number): void {
    this.pendingMainOeuvre.splice(index, 1);
    this.cdr.markForCheck();
  }

  get totalMainOeuvrePendingEstime(): number {
    return this.pendingMainOeuvre.reduce((sum, m) => sum + (m.hoursPlanned ?? 0) * (m.hourlyRate ?? 0), 0);
  }

  get totalPendingEstime(): number {
    return this.totalPiecesPendingEstime + this.totalMainOeuvrePendingEstime;
  }

  // ── Phase 1 → création de l'OT ────────────────────────────────
  submitOt(): void {
    console.log('%c🔥 VERSION CORRIGÉE CHARGÉE 🔥', 'color: red; font-size: 20px;');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    const fv = this.form.value;

    const request: OrdreTravailRequest = {
       
      entityType:       fv.entityType,
      entityId:         fv.entityId,
      typeMaintenance:  fv.typeMaintenance,
     orderType:        fv.typeOrdre,  
      priority:         fv.priorite || undefined,
      description:      fv.description || undefined,
      reportedDate:     fv.reportedDate || undefined,
      scheduledDate:    fv.scheduledDate || undefined,
      mileageAtOrder:   fv.mileageAtOrder ?? undefined,
      hoursAtOrder:     fv.hoursAtOrder ?? undefined,
      workshop:         fv.workshop || undefined,
      isExternal:       fv.isExternal,
      externalProvider: fv.externalProvider || undefined,
      estimatedCost:    fv.estimatedCost ?? undefined,
      notes:            fv.notes || undefined,
    };
console.log('Payload envoyé:', JSON.stringify(request));
    this.ordreTravailService.create(request).subscribe({
      next: (ot) => {
        if (this.pendingPieces.length === 0 && this.pendingMainOeuvre.length === 0) {
          this.ot = ot;
          this.loading = false;
          this.snackBar.open('Entretien créé', 'OK', { duration: 3000 });
          this.cdr.markForCheck();
          return;
        }
        this.persisterLignesEnAttente(ot.id, 0);
      },
      error: (err) => {
        console.error('Erreur création entretien', err);
        this.loading = false;
        this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  /** Persiste les pièces puis la main d'oeuvre en attente, une ligne à la fois (évite les écritures concurrentes sur le même OT). */
  private persisterLignesEnAttente(otId: number, index: number): void {
    const total = this.pendingPieces.length + this.pendingMainOeuvre.length;

    if (index >= total) {
      this.ordreTravailService.findById(otId).subscribe({
        next: (ot) => {
          this.ot = ot;
          this.pendingPieces = [];
          this.pendingMainOeuvre = [];
          this.loading = false;
          this.snackBar.open('Entretien créé avec ses pièces et main d\'œuvre', 'OK', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
      return;
    }

    if (index < this.pendingPieces.length) {
      const p = this.pendingPieces[index];
      this.ordreTravailService.addPiece(otId, {
        pieceRechangeId: p.pieceRechangeId,
        quantityPlanned: p.quantityPlanned,
        quantityUsed: p.quantityPlanned,
      }).subscribe({
        next: () => this.persisterLignesEnAttente(otId, index + 1),
        error: (err) => this.gererErreurLigne(otId, err),
      });
    } else {
      const m = this.pendingMainOeuvre[index - this.pendingPieces.length];
      this.ordreTravailService.addMainOeuvre(otId, {
        technicianName: m.technicianName,
        isExternal: m.isExternal,
        hoursPlanned: m.hoursPlanned,
        hourlyRate: m.hourlyRate,
      }).subscribe({
        next: () => this.persisterLignesEnAttente(otId, index + 1),
        error: (err) => this.gererErreurLigne(otId, err),
      });
    }
  }

  /** En cas d'échec d'une ligne (ex: stock devenu insuffisant entre-temps), on recharge l'état réel de l'OT
   *  pour que l'utilisateur voie ce qui a effectivement été enregistré et puisse compléter manuellement. */
  private gererErreurLigne(otId: number, err: any): void {
    this.ordreTravailService.findById(otId).subscribe({
      next: (ot) => {
        this.ot = ot;
        this.pendingPieces = [];
        this.pendingMainOeuvre = [];
        this.loading = false;
        this.snackBar.open(
          `Entretien créé, mais une ligne a échoué (${err?.error?.message || 'erreur inconnue'}). Complétez manuellement ci-dessous si besoin.`,
          'Fermer', { duration: 6000 }
        );
        this.cdr.markForCheck();
      }
    });
  }

  // ── Phase 2 : pièces ───────────────────────────────────────────
  ajouterPiece(): void {
    if (this.pieceForm.invalid || !this.ot) {
      this.pieceForm.markAllAsTouched();
      return;
    }

    this.ajoutPieceLoading = true;
    const fv = this.pieceForm.value;

    this.ordreTravailService.addPiece(this.ot.id, {
      pieceRechangeId: fv.pieceRechangeId,
      quantityPlanned: fv.quantityPlanned,
      quantityUsed: fv.quantityPlanned, // ← quantité réellement consommée = quantité saisie
    }).subscribe({
      next: (ot) => {
        this.ot = ot;
        this.ajoutPieceLoading = false;
        this.pieceForm.reset({ pieceRechangeId: null, quantityPlanned: 1 });
        this.pieceAutocompleteResetKey++;
        this.loadPieces(); // rafraîchit les stocks disponibles
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.ajoutPieceLoading = false;
        this.snackBar.open(err?.error?.message || 'Erreur lors de l\'ajout de la pièce', 'Fermer', { duration: 4000 });
        this.cdr.markForCheck();
      }
    });
  }

  retirerPiece(pieceOtId: number): void {
    if (!this.ot) return;
    this.ordreTravailService.removePiece(this.ot.id, pieceOtId).subscribe({
      next: (ot) => { this.ot = ot; this.loadPieces(); this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Erreur lors du retrait de la pièce', 'Fermer', { duration: 3000 })
    });
  }

  // ── Phase 2 : main d'oeuvre ────────────────────────────────────
  ajouterMainOeuvre(): void {
    if (this.mainOeuvreForm.invalid || !this.ot) {
      this.mainOeuvreForm.markAllAsTouched();
      return;
    }

    this.ajoutMainOeuvreLoading = true;
    const fv = this.mainOeuvreForm.value;

    this.ordreTravailService.addMainOeuvre(this.ot.id, {
      technicianName: fv.technicianName,
      isExternal:     fv.isExternal,
      hoursPlanned:   fv.hoursPlanned ?? undefined,
      hourlyRate:     fv.hourlyRate ?? undefined,
    }).subscribe({
      next: (ot) => {
        this.ot = ot;
        this.ajoutMainOeuvreLoading = false;
        this.mainOeuvreForm.reset({ technicianName: '', isExternal: false, hoursPlanned: null, hourlyRate: null });
        this.cdr.markForCheck();
      },
      error: () => {
        this.ajoutMainOeuvreLoading = false;
        this.snackBar.open('Erreur lors de l\'ajout de la main d\'œuvre', 'Fermer', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  retirerMainOeuvre(moId: number): void {
    if (!this.ot) return;
    this.ordreTravailService.removeMainOeuvre(this.ot.id, moId).subscribe({
      next: (ot) => { this.ot = ot; this.cdr.markForCheck(); },
      error: () => this.snackBar.open('Erreur lors du retrait', 'Fermer', { duration: 3000 })
    });
  }

  // ── Fermeture ────────────────────────────────────────────────
  close(): void {
    this.closed.emit();
  }

  terminer(): void {
    this.entretienSaved.emit();
  }

  onBackdropClick(): void {
    if (!this.loading) this.close();
  }
}