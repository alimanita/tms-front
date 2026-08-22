import {
  Component, EventEmitter, Input, Output,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PieceRechangeRequest, PieceRechangeResponse } from '../../ordre-travail/ordre-travail.model';
import { OrdreTravailService } from '../../ordre-travail/ordre-travail.service';


@Component({
  selector: 'app-piece-rechange-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './piece-rechange-form.component.html',
  styleUrl: './piece-rechange-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceRechangeFormComponent {
  isOpen = false;
  editingId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  //@Output() saved = new EventEmitter<void>();
@Output() saved = new EventEmitter<PieceRechangeResponse>();
@Input() set open(val: boolean) {
  console.log('SETTER open() appelé avec:', val);
  this.isOpen = val;
  if (val) this.initForm();
  this.cdr.markForCheck();
}

  @Input() piece: PieceRechangeResponse | null = null;
  @Input() presetName: string | null = null;
  form!: FormGroup;
  loading = false;

  readonly unitOptions = ['pièce', 'litre', 'kg', 'boîte', 'jeu'];

  constructor(
    private fb: FormBuilder,
    private ordreTravailService: OrdreTravailService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  private initForm(): void {
    this.editingId = this.piece?.id ?? null;

    this.form = this.fb.group({
      reference:   [this.piece?.reference ?? ''],
      name:        [this.piece?.name ?? '', Validators.required],
      brand:       [this.piece?.brand ?? ''],
      unit:        [this.piece?.unit ?? 'pièce'],
      unitCost:    [this.piece?.unitCost ?? null, Validators.min(0)],
      stockQty:    [this.piece?.stockQty ?? 0, [Validators.required, Validators.min(0)]],
      minStockQty: [this.piece?.minStockQty ?? 0, [Validators.required, Validators.min(0)]],
      location:    [this.piece?.location ?? ''],
      amountHT:    [this.piece?.amountHT ?? null, Validators.min(0)],
      tvaRate:     [this.piece?.tvaRate ?? 19, Validators.min(0)],
      tvaAmount:   [{ value: this.piece?.tvaAmount ?? null, disabled: true }],
      isTvaRecoverable: [this.piece?.isTvaRecoverable ?? false],
      recoverableTvaAmount: [{ value: this.piece?.recoverableTvaAmount ?? null, disabled: true }],
    });

    this.form.valueChanges.subscribe(() => this.calculateTva());
    this.cdr.markForCheck();
  }

  selectedFile: File | null = null;
  selectedFileName = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  private calculateTva(): void {
    const fv = this.form.getRawValue();
    const ht = fv.amountHT || 0;
    const rate = fv.tvaRate || 0;
    const tva = (ht * rate) / 100;
    
    let recoverable = 0;
    if (fv.isTvaRecoverable) {
       recoverable = tva;
    }

    if (this.form.get('tvaAmount')?.value !== tva) {
       this.form.patchValue({ tvaAmount: tva }, { emitEvent: false });
    }
    if (this.form.get('recoverableTvaAmount')?.value !== recoverable) {
       this.form.patchValue({ recoverableTvaAmount: recoverable }, { emitEvent: false });
    }
  }

  get isEdit(): boolean {
    return this.editingId !== null;
  }

 onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    const fv = this.form.getRawValue();
    const request: PieceRechangeRequest = {
      reference:   fv.reference,
      name:        fv.name,
      brand:       fv.brand || undefined,
      unit:        fv.unit || undefined,
      unitCost:    fv.unitCost ?? undefined,
      stockQty:    fv.stockQty,
      minStockQty: fv.minStockQty,
      location:    fv.location || undefined,
      amountHT:    fv.amountHT ?? undefined,
      tvaRate:     fv.tvaRate ?? undefined,
      tvaAmount:   fv.tvaAmount ?? undefined,
      isTvaRecoverable: fv.isTvaRecoverable,
      recoverableTvaAmount: fv.recoverableTvaAmount ?? undefined
    };
    this.ordreTravailService.savePiece(request, this.editingId ?? undefined).subscribe({
      next: (response) => {
        if (this.selectedFile) {
          this.ordreTravailService.uploadPieceProofFile(response.id, this.selectedFile).subscribe({
            next: (finalRes) => {
               this.loading = false;
               this.snackBar.open(this.isEdit ? 'Pièce mise à jour avec justificatif' : 'Pièce créée avec justificatif', 'OK', { duration: 2500 });
               this.saved.emit(finalRes);
            },
            error: () => {
               this.loading = false;
               this.snackBar.open('Pièce enregistrée mais erreur justificatif', 'Fermer', { duration: 3000 });
               this.saved.emit(response);
            }
          });
        } else {
          this.loading = false;
          this.snackBar.open(this.isEdit ? 'Pièce mise à jour' : 'Pièce créée', 'OK', { duration: 2500 });
          this.saved.emit(response);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message ?? 'Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
        this.cdr.markForCheck();
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.loading) this.close();
  }

  extractData(): void {
    if (!this.selectedFile) return;
    this.loading = true;
    this.snackBar.open('Extraction des données en cours...', '', { duration: 3000 });
    this.cdr.markForCheck();
    
    this.ordreTravailService.extractPieceData(this.selectedFile).subscribe({
      next: (data) => {
        this.loading = false;
        this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        
        if (data.name) this.form.patchValue({ name: data.name });
        if (data.brand) this.form.patchValue({ brand: data.brand });
        if (data.unitCost) this.form.patchValue({ unitCost: data.unitCost });
        if (data.amountHT) this.form.patchValue({ amountHT: data.amountHT });
        if (data.tvaRate) this.form.patchValue({ tvaRate: data.tvaRate });
        
        // This will trigger calculateTva indirectly, but if amountHT or tvaRate didn't trigger it nicely, we can call it manually
        this.calculateTva();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erreur lors de l\'extraction', 'Fermer', { duration: 5000 });
        this.cdr.markForCheck();
      }
    });
  }
}