import { Component, Input, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MissionService } from '../mission.service';
import { DepenseMissionResponse, TypeDepense } from '../mission.model';

@Component({
  selector: 'app-mission-expenses',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatSnackBarModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './mission-expenses.component.html',
  styleUrls: ['./mission-expenses.component.scss'],
})
export class MissionExpensesComponent implements OnInit {

  @Input({ required: true }) missionId!: number;
  @Input() readonly = false;

  private readonly zone = inject(NgZone);
  private readonly cdr  = inject(ChangeDetectorRef);

  depenses: DepenseMissionResponse[] = [];
  loading = false;
  showForm = false;
  form!: FormGroup;
  submitted = false;

  readonly typeOptions: { value: TypeDepense; label: string }[] = [
    { value: TypeDepense.FUEL, label: 'Carburant' },
    { value: TypeDepense.TOLL, label: 'Péage' },
    { value: TypeDepense.MEAL, label: 'Repas' },
    { value: TypeDepense.LODGING, label: 'Hébergement' },
    { value: TypeDepense.REPAIR, label: 'Réparation' },
    { value: TypeDepense.OTHER, label: 'Autre' },
  ];

  constructor(
    private missionService: MissionService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      expenseType:    [TypeDepense.TOLL, Validators.required],
      montant:        [null, [Validators.required, Validators.min(0.001)]],
      expenseDate:    ['', Validators.required],
      description:    [''],
      isReimbursable: [true],
    });

    this.form.get('expenseType')?.valueChanges.subscribe(val => {
      if (val === TypeDepense.FUEL) {
        this.initFuelForm();
        this.fuelForm.patchValue({
          expenseDate: this.form.value.expenseDate || new Date().toISOString().slice(0, 16),
        });
        this.isFuelDrawerOpen = true;
        this.showForm = false;
        
        // Remettre à Péage pour la prochaine fois
        this.form.patchValue({ expenseType: TypeDepense.TOLL }, { emitEvent: false });
      }
    });

    this.load();
  }

  get totalDepenses(): number {
    return this.depenses.reduce((sum, d) => sum + (d.montant ?? 0), 0);
  }

  load(): void {
    this.loading = true;
    this.missionService.findDepenses(this.missionId).subscribe({
      next: (list) => this.zone.run(() => {
        this.depenses = list;
        this.loading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des dépenses', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.submitted = false;
    if (this.showForm) {
      this.form.reset({ expenseType: TypeDepense.TOLL, isReimbursable: true });
    }
  }

  isFuelDrawerOpen = false;
  fuelForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fuelSubmitted = false;
  fuelSaving = false;

  initFuelForm(): void {
    this.fuelForm = this.fb.group({
      expenseType:    [TypeDepense.FUEL, Validators.required],
      montant:        [{value: null, disabled: true}],
      expenseDate:    [new Date().toISOString().slice(0, 16), Validators.required],
      description:    [''],
      isReimbursable: [true],
      quantityLiters: [null, [Validators.required, Validators.min(0.001)]],
      pricePerLiter:  [null, [Validators.required, Validators.min(0.001)]],
      mileageBefore:  [null],
      mileageAfter:   [null],
      isFullTank:     [true],
      receiptNumber:  ['']
    });
  }

  get totalEstime(): number {
    if (!this.fuelForm) return 0;
    const q = +(this.fuelForm.get('quantityLiters')?.value ?? 0);
    const p = +(this.fuelForm.get('pricePerLiter')?.value ?? 0);
    return +(q * p).toFixed(3);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  closeFuelDrawer(): void {
    this.isFuelDrawerOpen = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.fuelSubmitted = false;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fv = this.form.value;
    const request = {
      expenseType:    fv.expenseType,
      montant:        fv.montant,
      expenseDate:    fv.expenseDate,
      description:    fv.description || undefined,
      isReimbursable: fv.isReimbursable,
    };

    this.missionService.addDepense(this.missionId, request).subscribe({
      next: (created) => this.zone.run(() => {
        this.depenses = [...this.depenses, created];
        this.snackBar.open('Dépense ajoutée', 'Fermer', { duration: 2500 });
        this.showForm = false;
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(
          err.error?.message ?? "Erreur lors de l'ajout de la dépense", 'Fermer', { duration: 3000 }
        );
        this.cdr.detectChanges();
      }),
    });
  }

  onSubmitFuel(): void {
    this.fuelSubmitted = true;
    if (this.fuelForm.invalid) {
      this.fuelForm.markAllAsTouched();
      return;
    }

    this.fuelSaving = true;
    const fv = this.fuelForm.getRawValue(); // gets disabled fields too
    const request = {
      expenseType:    fv.expenseType,
      montant:        this.totalEstime, // montant = total estimé
      expenseDate:    fv.expenseDate,
      description:    fv.description || undefined,
      isReimbursable: fv.isReimbursable,
      quantityLiters: fv.quantityLiters,
      pricePerLiter:  fv.pricePerLiter,
      mileageBefore:  fv.mileageBefore,
      mileageAfter:   fv.mileageAfter,
      isFullTank:     fv.isFullTank,
      receiptNumber:  fv.receiptNumber
    };

    this.missionService.addDepense(this.missionId, request, this.selectedFile || undefined).subscribe({
      next: (created) => this.zone.run(() => {
        this.depenses = [...this.depenses, created];
        this.snackBar.open('Dépense de carburant ajoutée', 'Fermer', { duration: 2500 });
        this.closeFuelDrawer();
        this.fuelSaving = false;
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(
          err.error?.message ?? "Erreur lors de l'ajout de la dépense de carburant", 'Fermer', { duration: 3000 }
        );
        this.fuelSaving = false;
        this.cdr.detectChanges();
      }),
    });
  }

  supprimer(d: DepenseMissionResponse): void {
    const confirmation = window.confirm('Supprimer cette dépense ?');
    if (!confirmation) return;

    this.missionService.removeDepense(this.missionId, d.id).subscribe({
      next: () => this.zone.run(() => {
        this.depenses = this.depenses.filter(x => x.id !== d.id);
        this.snackBar.open('Dépense supprimée', 'Fermer', { duration: 2500 });
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(
          err.error?.message ?? 'Erreur lors de la suppression', 'Fermer', { duration: 3000 }
        );
        this.cdr.detectChanges();
      }),
    });
  }

  getTypeLabel(t: TypeDepense): string {
    return this.typeOptions.find(o => o.value === t)?.label ?? t;
  }
}