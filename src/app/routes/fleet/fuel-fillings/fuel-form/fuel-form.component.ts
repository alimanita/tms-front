import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse, PleinCarburantRequest } from '../../fleet.service';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fuel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './fuel-form.component.html',
  styleUrls: ['./fuel-form.component.scss'],
})
export class FuelFormComponent implements OnInit {
  form!: FormGroup;
  isEdit    = false;
  pleinId?: number;
  loading   = false;
  submitted = false;
  vehicules: VehiculeResponse[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingProofUrl: string | null = null;
  readonly fuelTypes = ['DIESEL', 'ESSENCE', 'GPL', 'ELECTRIQUE'];

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      vehiculeId:     [null, Validators.required],
      fillingDate:    [new Date().toISOString().slice(0, 16), Validators.required],
      fuelType:       ['DIESEL', Validators.required],
      quantityLiters: [null, [Validators.required, Validators.min(0.001)]],
      pricePerLiter:  [null, [Validators.required, Validators.min(0.001)]],
      mileageBefore:  [null],
      mileageAfter:   [null],
      isFullTank:     [true],
      tvaRate:        [20, Validators.required],
      isTvaRecoverable:[true],
      receiptNumber:  [''],
      notes:          [''],
    });

    this.fleetService.getVehicules().subscribe({
      next: (page: any) => {
        this.vehicules = page.content ?? page;
        const qpVehiculeId = this.route.snapshot.queryParams['vehiculeId'];
        if (qpVehiculeId && !this.isEdit) {
          this.form.patchValue({ vehiculeId: +qpVehiculeId });
        }
      },
      error: () => this.snackBar.open('Erreur chargement véhicules', 'Fermer', { duration: 3000 })
    });

    this.route.params.subscribe(p => {
      if (p['id']) {
        this.isEdit  = true;
        this.pleinId = +p['id'];
      this.fleetService.getPleinById(this.pleinId).subscribe({
  next: data => {
    this.form.patchValue({
      vehiculeId: (data as any).vehiculeId,
      fillingDate:    data.fillingDate?.slice(0, 16),
      fuelType:       data.fuelType,
      quantityLiters: data.quantityLiters,
      pricePerLiter:  data.pricePerLiter,
      mileageBefore:  data.mileageBefore,
      mileageAfter:   data.mileageAfter,
      isFullTank:     data.isFullTank,
      tvaRate:        data.tvaRate ?? 20,
      isTvaRecoverable: data.isTvaRecoverable ?? true,
      receiptNumber:  data.receiptNumber,
      notes:          data.notes,
    });
    // ✅ Fix : proofUrl, pas proofFilePath — et directement utilisable
    if (data.proofUrl) {
      this.existingProofUrl = data.proofUrl;
    }
  },
  error: () => this.snackBar.open('Erreur chargement plein', 'Fermer', { duration: 3000 })
});
      }
    });
  }

  get totalEstime(): number {
    const q = +(this.form.get('quantityLiters')?.value ?? 0);
    const p = +(this.form.get('pricePerLiter')?.value ?? 0);
    return +(q * p).toFixed(3);
  }

  get tvaRateValue(): number {
    return +(this.form.get('tvaRate')?.value ?? 0);
  }

  get totalHT(): number {
    if (this.tvaRateValue === 0) return this.totalEstime;
    return +(this.totalEstime / (1 + this.tvaRateValue / 100)).toFixed(3);
  }

  get tvaAmountValue(): number {
    return +(this.totalEstime - this.totalHT).toFixed(3);
  }

  get recoverableTvaAmountValue(): number {
    const recoverable = this.form.get('isTvaRecoverable')?.value;
    return recoverable ? this.tvaAmountValue : 0;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    const fv = this.form.value;

    const request: PleinCarburantRequest = {
      vehiculeId:     fv.vehiculeId,
      fillingDate:    fv.fillingDate,
      fuelType:       fv.fuelType,
      quantityLiters: fv.quantityLiters,
      pricePerLiter:  fv.pricePerLiter,
      mileageBefore:  fv.mileageBefore  ?? undefined,
      mileageAfter:   fv.mileageAfter   ?? undefined,
      isFullTank:     fv.isFullTank,
      amountHT:       this.totalHT as any,
      amountTTC:      this.totalEstime as any,
      tvaRate:        fv.tvaRate,
      tvaAmount:      this.tvaAmountValue as any,
      isTvaRecoverable: fv.isTvaRecoverable,
      recoverableTvaAmount: this.recoverableTvaAmountValue as any,
      acciseAmount:   0 as any,
      receiptNumber:  fv.receiptNumber  || undefined,
      notes:          fv.notes          || undefined,
    };

    this.fleetService.savePlein(request, this.selectedFile ?? undefined).subscribe({
      next: () => {
        this.loading = false; // ✅ Fix : débloque le bouton avant/pendant la navigation
        this.snackBar.open('Plein enregistré', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/fuel-fillings']);
      },
      error: (err) => {
        const status = err?.status || 'Unknown';
        const msg = err?.message || JSON.stringify(err);
        const backendError = err?.error ? JSON.stringify(err.error) : '';
        const fullError = `Status: ${status} | Msg: ${msg} | Backend: ${backendError}`;
        
        alert("Erreur technique : " + fullError);
        this.snackBar.open('Erreur: ' + status, 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void { this.router.navigate(['/fleet/fuel-fillings']); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // On garde le fichier d'origine tel quel. Le service gérera le nom.
    this.selectedFile = file;

    if (this.selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.previewUrl = null;
    }

    // Réinitialise les deux inputs pour éviter les conflits lors d'une 2ème sélection
    (document.getElementById('proofFile') as HTMLInputElement | null)?.value !== undefined &&
      ((document.getElementById('proofFile') as HTMLInputElement).value = '');
    (document.getElementById('proofCamera') as HTMLInputElement | null)?.value !== undefined &&
      ((document.getElementById('proofCamera') as HTMLInputElement).value = '');
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  extractData(): void {
    if (!this.selectedFile) return;
    this.loading = true;
    this.snackBar.open('Extraction des données en cours...', '', { duration: 3000 });
    this.fleetService.extractFuelData(this.selectedFile).subscribe({
      next: (data) => {
        this.loading = false;
        this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        if (data.quantityLiters) this.form.patchValue({ quantityLiters: data.quantityLiters });
        if (data.totalCost && data.quantityLiters && data.quantityLiters > 0) {
          const pricePerLiter = (data.totalCost / data.quantityLiters).toFixed(3);
          this.form.patchValue({ pricePerLiter: parseFloat(pricePerLiter) });
        }
       if (data.fillingDate) this.form.patchValue({ fillingDate: data.fillingDate.slice(0, 16) });
        if (data.fuelType) {
          const upperType = data.fuelType.toUpperCase();
          if (this.fuelTypes.includes(upperType)) {
            this.form.patchValue({ fuelType: upperType });
          }
        }
        if (data.tvaAmount) {
           // We might deduce TVA rate from amount, but maybe better not override if already set, or calculate it.
           // const rate = (data.tvaAmount / (data.totalCost - data.tvaAmount)) * 100;
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erreur lors de l\'extraction', 'Fermer', { duration: 5000 });
      }
    });
  }
}