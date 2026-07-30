import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';

@Component({
  selector: 'app-pneu-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  templateUrl: './pneu-form.component.html',
  styleUrls: ['./pneu-form.component.scss'],
})
export class PneuFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  pneuId?: number;
  loading = false;
  submitted = false;

  readonly types = ['SUMMER', 'WINTER', 'ALL_SEASON'];
  readonly statuts = ['STOCK', 'MOUNTED', 'RETREADING', 'SCRAP'];

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      serialNumber: ['', Validators.required],
      brand: [''],
      model: [''],
      size: [''],
      type: ['ALL_SEASON'],
      purchaseDate: [null],
      purchaseCost: [0, Validators.min(0)],
      maxKm: [0, Validators.min(0)],
      status: ['STOCK'],
      isActive: [true],
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.pneuId = +id;

        this.fleetService.getPneuById(this.pneuId).subscribe({
          next: p => this.form.patchValue({
            serialNumber: p.serialNumber,
            brand: p.brand,
            model: p.model,
            size: p.size,
            type: p.type ?? 'ALL_SEASON',
            purchaseDate: p.purchaseDate ?? null,
            purchaseCost: p.purchaseCost ?? 0,
            maxKm: p.maxKm ?? 0,
            status: p.status ?? 'STOCK',
            isActive: p.isActive ?? true,
          }),
          error: () => this.snackBar.open('Erreur chargement pneu', 'Fermer', { duration: 3000 })
        });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    const request$ = this.isEdit && this.pneuId
      ? this.fleetService.savePneu(this.form.value, this.pneuId)
      : this.fleetService.savePneu(this.form.value);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Pneu enregistré', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/pneus']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/pneus']);
  }
}
