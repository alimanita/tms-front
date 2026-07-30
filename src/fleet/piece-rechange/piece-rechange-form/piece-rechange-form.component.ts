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
    });

    this.cdr.markForCheck();
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
    const fv = this.form.value;
    const request: PieceRechangeRequest = {
      reference:   fv.reference,
      name:        fv.name,
      brand:       fv.brand || undefined,
      unit:        fv.unit || undefined,
      unitCost:    fv.unitCost ?? undefined,
      stockQty:    fv.stockQty,
      minStockQty: fv.minStockQty,
      location:    fv.location || undefined,
    };
    this.ordreTravailService.savePiece(request, this.editingId ?? undefined).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(this.isEdit ? 'Pièce mise à jour' : 'Pièce créée', 'OK', { duration: 2500 });
        this.saved.emit(response); 
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
}