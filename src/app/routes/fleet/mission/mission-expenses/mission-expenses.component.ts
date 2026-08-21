import { Component, Input, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { MissionService } from '../mission.service';
import { DepenseMissionResponse, TypeDepense } from '../mission.model';
import { FleetService } from '../../fleet.service';

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
  private readonly sanitizer = inject(DomSanitizer);

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
    private fleetService: FleetService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      expenseType:    [TypeDepense.MEAL, Validators.required],
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
        
        // Remettre à Autre pour la prochaine fois
        this.form.patchValue({ expenseType: TypeDepense.MEAL }, { emitEvent: false });
      } else if (val === TypeDepense.TOLL) {
        this.initTollForm();
        this.tollForm.patchValue({
          expenseDate: this.form.value.expenseDate || new Date().toISOString().slice(0, 16),
        });
        this.isTollDrawerOpen = true;
        this.showForm = false;
        
        // Remettre à Autre pour la prochaine fois
        this.form.patchValue({ expenseType: TypeDepense.MEAL }, { emitEvent: false });
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
      this.form.reset({ expenseType: TypeDepense.MEAL, isReimbursable: true });
    }
  }

  isFuelDrawerOpen = false;
  fuelForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fuelSubmitted = false;
  fuelSaving = false;
  extractingFuel = false;

  // -- Toll (Péage) --
  isTollDrawerOpen = false;
  tollForm!: FormGroup;
  tollSubmitted = false;
  tollSaving = false;
  extractingToll = false;


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

  initTollForm(): void {
    this.tollForm = this.fb.group({
      expenseType:      [TypeDepense.TOLL, Validators.required],
      amountHT:         [null, [Validators.required, Validators.min(0)]],
      tvaRate:          [20, [Validators.min(0)]],
      montant:          [{value: null, disabled: true}],
      expenseDate:      [new Date().toISOString().slice(0, 16), Validators.required],
      description:      [''],
      isReimbursable:   [true],
      isTvaRecoverable: [false],
      receiptNumber:    ['']
    });

    this.tollForm.valueChanges.subscribe(() => {
      const ht = +(this.tollForm.get('amountHT')?.value ?? 0);
      const tva = +(this.tollForm.get('tvaRate')?.value ?? 0);
      const ttc = ht * (1 + tva / 100);
      this.tollForm.get('montant')?.setValue(ttc.toFixed(3), {emitEvent: false});
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

  closeTollDrawer(): void {
    this.isTollDrawerOpen = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.tollSubmitted = false;
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

  onSubmitToll(): void {
    this.tollSubmitted = true;
    if (this.tollForm.invalid) {
      this.tollForm.markAllAsTouched();
      return;
    }

    this.tollSaving = true;
    const fv = this.tollForm.getRawValue();
    const request = {
      expenseType:      fv.expenseType,
      montant:          +(fv.montant),
      expenseDate:      fv.expenseDate,
      description:      fv.description || undefined,
      isReimbursable:   fv.isReimbursable,
      receiptNumber:    fv.receiptNumber,
      amountHT:         fv.amountHT,
      tvaRate:          fv.tvaRate,
      tvaAmount:        +(fv.amountHT * fv.tvaRate / 100).toFixed(3),
      isTvaRecoverable: fv.isTvaRecoverable
    };

    this.missionService.addDepense(this.missionId, request, this.selectedFile || undefined).subscribe({
      next: (created) => this.zone.run(() => {
        this.depenses = [...this.depenses, created];
        this.snackBar.open('Dépense de péage ajoutée', 'Fermer', { duration: 2500 });
        this.closeTollDrawer();
        this.tollSaving = false;
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(
          err.error?.message ?? "Erreur lors de l'ajout de la dépense de péage", 'Fermer', { duration: 3000 }
        );
        this.tollSaving = false;
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

  viewReceipt(d: DepenseMissionResponse): void {
    this.proofModalOpen = true;
    this.proofLoading   = true;
    this.proofSafeUrl   = null;
    this.proofIsImage   = false;
    this.currentDepense = d;

    this.missionService.downloadReceipt(this.missionId, d.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.proofIsImage = blob.type.startsWith('image/');
        this.proofSafeUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.proofLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.proofLoading = false;
        this.proofModalOpen = false;
        this.snackBar.open('Impossible de charger le justificatif', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  closeProofModal(): void {
    this.proofModalOpen = false;
    this.proofSafeUrl   = null;
    this.currentDepense = null;
  }

  downloadReceipt(): void {
    if (!this.currentDepense) return;
    this.missionService.downloadReceipt(this.missionId, this.currentDepense.id).subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `justificatif-depense-${this.currentDepense!.id}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 3000 })
    });
  }

  // ── Modal justificatif ──────────────────────────────────────────────────────
  proofModalOpen  = false;
  proofLoading    = false;
  proofIsImage    = false;
  proofSafeUrl: SafeUrl | null = null;
  currentDepense: DepenseMissionResponse | null = null;

  // ── Extraction IA ───────────────────────────────────────────────────────────
  extractFuelData(): void {
    if (!this.selectedFile) return;
    this.extractingFuel = true;
    this.snackBar.open('Extraction des données en cours…', '', { duration: 3000 });
    this.fleetService.extractFuelData(this.selectedFile).subscribe({
      next: (data) => this.zone.run(() => {
        this.extractingFuel = false;
        this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        if (data.quantityLiters) this.fuelForm.patchValue({ quantityLiters: data.quantityLiters });
        if (data.totalCost && data.quantityLiters && data.quantityLiters > 0) {
          this.fuelForm.patchValue({ pricePerLiter: +(data.totalCost / data.quantityLiters).toFixed(3) });
        }
        if (data.fillingDate) this.fuelForm.patchValue({ expenseDate: data.fillingDate.slice(0, 16) });
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.extractingFuel = false;
        this.snackBar.open("Erreur lors de l'extraction", 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      })
    });
  }

  extractTollData(): void {
    if (!this.selectedFile) return;
    this.extractingToll = true;
    this.snackBar.open('Extraction des données en cours…', '', { duration: 3000 });
    this.fleetService.extractPeageData(this.selectedFile).subscribe({
      next: (res) => this.zone.run(() => {
        this.extractingToll = false;
        this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        if (res) {
          this.tollForm.patchValue({
            amountHT:      res.amountHT  ?? null,
            tvaRate:       res.tvaRate   ?? 20,
            receiptNumber: res.receiptNumber ?? '',
            description:   [res.entree, res.sortie].filter(Boolean).join(' → ') || '',
          });
          if (res.receiptDate) this.tollForm.patchValue({ expenseDate: res.receiptDate });
        }
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.extractingToll = false;
        this.snackBar.open("Erreur lors de l'extraction OCR", 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      })
    });
  }
}