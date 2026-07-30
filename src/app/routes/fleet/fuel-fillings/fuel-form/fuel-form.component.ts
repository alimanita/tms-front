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
          next: data => this.form.patchValue({
            vehiculeId:     data.vehicule?.id,
            fillingDate:    data.fillingDate?.slice(0, 16),
            fuelType:       data.fuelType,
            quantityLiters: data.quantityLiters,
            pricePerLiter:  data.pricePerLiter,
            mileageBefore:  data.mileageBefore,
            mileageAfter:   data.mileageAfter,
            isFullTank:     data.isFullTank,
            receiptNumber:  data.receiptNumber,
            notes:          data.notes,
          }),
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
      receiptNumber:  fv.receiptNumber  || undefined,
      notes:          fv.notes          || undefined,
    };

 this.fleetService.savePlein(request, this.selectedFile ?? undefined).subscribe({
  next: () => {
    this.snackBar.open('Plein enregistré', 'Fermer', { duration: 3000 });
    this.router.navigate(['/fleet/fuel-fillings']);
  },
  error: () => {
    this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
    this.loading = false;
  }
});
  }

  onCancel(): void { this.router.navigate(['/fleet/fuel-fillings']); }

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
    this.previewUrl = null; // pas d'aperçu pour un PDF par ex.
  }
}

removeFile(): void {
  this.selectedFile = null;
  this.previewUrl = null;
}
}